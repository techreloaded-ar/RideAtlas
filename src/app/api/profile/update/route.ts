import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { z } from 'zod';
import { validateAndSanitizeUrl } from '@/lib/utils/url-sanitizer';
import { SocialPlatform } from '@/types/user';
import { updateProfileSchema as sharedUpdateProfileSchema } from '@/schemas/profile';

// Social links validation schema
const socialLinksSchema = z.object({
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
}).optional();

// Extended profile update schema including social links
const updateProfileSchema = sharedUpdateProfileSchema.extend({
  socialLinks: socialLinksSchema,
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Dati non validi', 
          details: validation.error.errors 
        }, 
        { status: 400 }
      );
    }

    const { name, bio, bikeDescription, socialLinks } = validation.data;
    const userId = session.user.id;

    // Validate and sanitize social links if provided
    let sanitizedSocialLinks: Record<string, string> | null = null;
    if (socialLinks) {
      const socialLinksErrors: string[] = [];
      const tempSocialLinks: Record<string, string | null> = {};

      // Validate each social link
      Object.entries(socialLinks).forEach(([platform, url]) => {
        if (url && url.trim()) {
          const result = validateAndSanitizeUrl(platform as SocialPlatform, url);
          if (result.isValid) {
            tempSocialLinks[platform] = result.sanitizedUrl;
          } else {
            socialLinksErrors.push(`${platform}: ${result.error}`);
          }
        } else {
          // Empty values are allowed
          tempSocialLinks[platform] = null;
        }
      });

      // If there are validation errors, return them
      if (socialLinksErrors.length > 0) {
        return NextResponse.json(
          { 
            error: 'Link social non validi', 
            details: socialLinksErrors 
          }, 
          { status: 400 }
        );
      }

      // Remove null values for cleaner storage
      const validLinks = Object.fromEntries(
        Object.entries(tempSocialLinks).filter(([, value]) => value !== null)
      ) as Record<string, string>;

      // If no valid links, set to null
      if (Object.keys(validLinks).length === 0) {
        sanitizedSocialLinks = null;
      } else {
        sanitizedSocialLinks = validLinks;
      }
    }

    // Aggiorna le informazioni dell'utente
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio: bio || null,
        bikeDescription: bikeDescription || null,
        socialLinks: sanitizedSocialLinks ?? undefined
      },
      select: {
        id: true,
        name: true,
        bio: true,
        bikeDescription: true,
        email: true,
        socialLinks: true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del profilo:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' }, 
      { status: 500 }
    );
  }
}