import { prisma } from '@/lib/prisma';
import { PurchaseStatus } from '@prisma/client';

export interface PurchaseInfo {
  id: string;
  userId: string;
  tripId: string;
  amount: number;
  status: PurchaseStatus;
  purchasedAt: Date | null;
  createdAt: Date;
}

export interface TransactionInfo {
  id: string;
  purchaseId: string;
  amount: number;
  status: PurchaseStatus;
  paymentMethod: string | null;
  failureReason: string | null;
  createdAt: Date;
}

export interface TripWithPurchaseInfo {
  id: string;
  title: string;
  price: number;
  hasPurchased: boolean;
  isOwner: boolean;
  purchase?: PurchaseInfo;
}

export class PurchaseService {
  static async hasPurchasedTrip(userId: string, tripId: string): Promise<boolean> {
    if (!userId || !tripId) return false;

    const purchase = await prisma.tripPurchase.findUnique({
      where: {
        userId_tripId: {
          userId,
          tripId
        }
      }
    });

    return purchase?.status === PurchaseStatus.COMPLETED;
  }

  static async canAccessPremiumContent(userId: string, tripId: string): Promise<boolean> {
    if (!userId || !tripId) return false;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { user_id: true }
    });

    if (!trip) return false;

    const isOwner = trip.user_id === userId;
    
    if (isOwner) return true;

    return await this.hasPurchasedTrip(userId, tripId);
  }

  static async getUserPurchases(userId: string): Promise<PurchaseInfo[]> {
    if (!userId) return [];

    const purchases = await prisma.tripPurchase.findMany({
      where: { 
        userId,
        status: PurchaseStatus.COMPLETED
      },
      orderBy: { purchasedAt: 'desc' }
    });

    return purchases.map(purchase => ({
      id: purchase.id,
      userId: purchase.userId,
      tripId: purchase.tripId,
      amount: Number(purchase.amount),
      status: purchase.status,
      purchasedAt: purchase.purchasedAt,
      createdAt: purchase.createdAt
    }));
  }

  static async getUserPurchasesWithTrips(userId: string) {
    if (!userId) return [];

    const purchases = await prisma.tripPurchase.findMany({
      where: { 
        userId,
        status: PurchaseStatus.COMPLETED
      },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            slug: true,
            destination: true,
            duration_days: true,
            duration_nights: true,
            theme: true,
            created_at: true
          }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    });

    return purchases;
  }

  static async createPurchase(userId: string, tripId: string): Promise<{ success: boolean; purchaseId?: string; error?: string }> {
    try {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { 
          id: true, 
          price: true, 
          user_id: true,
          status: true
        }
      });

      if (!trip) {
        return { success: false, error: 'Viaggio non trovato' };
      }

      if (trip.user_id === userId) {
        return { success: false, error: 'Non puoi acquistare il tuo stesso viaggio' };
      }

      if (trip.status !== 'Pubblicato') {
        return { success: false, error: 'Questo viaggio non è disponibile per l\'acquisto' };
      }

      const existingPurchase = await prisma.tripPurchase.findUnique({
        where: {
          userId_tripId: {
            userId,
            tripId
          }
        }
      });

      if (existingPurchase?.status === PurchaseStatus.COMPLETED) {
        return { success: false, error: 'Hai già acquistato questo viaggio' };
      }

      let purchase;
      if (existingPurchase && existingPurchase.status === PurchaseStatus.PENDING) {
        purchase = existingPurchase;
      } else if (existingPurchase && existingPurchase.status === PurchaseStatus.FAILED) {
        purchase = await prisma.tripPurchase.update({
          where: { id: existingPurchase.id },
          data: {
            status: PurchaseStatus.PENDING,
            amount: trip.price
          }
        });
      } else {
        purchase = await prisma.tripPurchase.create({
          data: {
            userId,
            tripId,
            amount: trip.price,
            status: PurchaseStatus.PENDING
          }
        });
      }

      await prisma.tripPurchaseTransaction.create({
        data: {
          purchaseId: purchase.id,
          amount: trip.price,
          status: PurchaseStatus.PENDING,
          paymentMethod: null
        }
      });

      return { success: true, purchaseId: purchase.id };

    } catch (error) {
      console.error('Errore nella creazione dell\'acquisto:', error);
      return { success: false, error: 'Errore interno del server' };
    }
  }

  static async completePurchase(purchaseId: string, paymentMethod: string = 'mock', stripePaymentId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const purchase = await prisma.tripPurchase.findUnique({
        where: { id: purchaseId }
      });

      if (!purchase) {
        return { success: false, error: 'Acquisto non trovato' };
      }

      if (purchase.status === PurchaseStatus.COMPLETED) {
        return { success: false, error: 'Acquisto già completato' };
      }

      const now = new Date();

      await prisma.$transaction([
        prisma.tripPurchase.update({
          where: { id: purchaseId },
          data: {
            status: PurchaseStatus.COMPLETED,
            paymentMethod,
            stripePaymentId,
            purchasedAt: now
          }
        }),
        prisma.tripPurchaseTransaction.create({
          data: {
            purchaseId,
            amount: purchase.amount,
            status: PurchaseStatus.COMPLETED,
            paymentMethod,
            stripePaymentId
          }
        })
      ]);

      return { success: true };

    } catch (error) {
      console.error('Errore nel completamento dell\'acquisto:', error);
      return { success: false, error: 'Errore interno del server' };
    }
  }

  static async failPurchase(purchaseId: string, failureReason?: string, paymentMethod?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const purchase = await prisma.tripPurchase.findUnique({
        where: { id: purchaseId }
      });

      if (!purchase) {
        return { success: false, error: 'Acquisto non trovato' };
      }

      await prisma.$transaction([
        prisma.tripPurchase.update({
          where: { id: purchaseId },
          data: {
            status: PurchaseStatus.FAILED
          }
        }),
        prisma.tripPurchaseTransaction.create({
          data: {
            purchaseId,
            amount: purchase.amount,
            status: PurchaseStatus.FAILED,
            paymentMethod,
            failureReason
          }
        })
      ]);

      return { success: true };

    } catch (error) {
      console.error('Errore nel fallimento dell\'acquisto:', error);
      return { success: false, error: 'Errore interno del server' };
    }
  }

  static async getTripWithPurchaseInfo(tripId: string, userId?: string): Promise<TripWithPurchaseInfo | null> {
    console.log(`🔍 [PURCHASE SERVICE] getTripWithPurchaseInfo - tripId: ${tripId}, userId: ${userId}`);
    
    try {
      console.log(`🔍 [PURCHASE SERVICE] Recupero trip dal database...`);
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: {
          id: true,
          title: true,
          price: true,
          user_id: true
        }
      });

      console.log(`🔍 [PURCHASE SERVICE] Trip trovato:`, trip);

      if (!trip) {
        console.log(`❌ [PURCHASE SERVICE] Trip non trovato per ID: ${tripId}`);
        return null;
      }

      const isOwner = userId ? trip.user_id === userId : false;
      console.log(`🔍 [PURCHASE SERVICE] isOwner check - userId: ${userId}, trip.user_id: ${trip.user_id}, isOwner: ${isOwner}`);
      
      let hasPurchased = false;
      let purchase = undefined;

      if (userId && !isOwner) {
        console.log(`🔍 [PURCHASE SERVICE] Utente non proprietario, verifico acquisti...`);
        const userPurchase = await prisma.tripPurchase.findUnique({
          where: {
            userId_tripId: {
              userId,
              tripId
            }
          }
        });

        console.log(`🔍 [PURCHASE SERVICE] User purchase trovato:`, userPurchase);

        hasPurchased = userPurchase?.status === PurchaseStatus.COMPLETED;
        if (userPurchase) {
          purchase = {
            id: userPurchase.id,
            userId: userPurchase.userId,
            tripId: userPurchase.tripId,
            amount: Number(userPurchase.amount),
            status: userPurchase.status,
            purchasedAt: userPurchase.purchasedAt,
            createdAt: userPurchase.createdAt
          };
        }
      }

      const result = {
        id: trip.id,
        title: trip.title,
        price: Number(trip.price),
        hasPurchased,
        isOwner,
        purchase
      };

      console.log(`✅ [PURCHASE SERVICE] Risultato finale:`, result);
      return result;

    } catch (error) {
      console.error('❌ [PURCHASE SERVICE] Errore nel recupero delle informazioni del viaggio:', error);
      console.error('❌ [PURCHASE SERVICE] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      return null;
    }
  }

  static async getPurchaseTransactions(purchaseId: string): Promise<TransactionInfo[]> {
    try {
      const transactions = await prisma.tripPurchaseTransaction.findMany({
        where: { purchaseId },
        orderBy: { createdAt: 'desc' }
      });

      return transactions.map(transaction => ({
        id: transaction.id,
        purchaseId: transaction.purchaseId,
        amount: Number(transaction.amount),
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        failureReason: transaction.failureReason,
        createdAt: transaction.createdAt
      }));

    } catch (error) {
      console.error('Errore nel recupero delle transazioni:', error);
      return [];
    }
  }

  static async getUserTransactionHistory(userId: string): Promise<Array<TransactionInfo & { tripTitle: string; tripId: string }>> {
    try {
      const transactions = await prisma.tripPurchaseTransaction.findMany({
        where: {
          purchase: {
            userId
          }
        },
        include: {
          purchase: {
            include: {
              trip: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return transactions.map(transaction => ({
        id: transaction.id,
        purchaseId: transaction.purchaseId,
        amount: Number(transaction.amount),
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        failureReason: transaction.failureReason,
        createdAt: transaction.createdAt,
        tripTitle: transaction.purchase.trip.title,
        tripId: transaction.purchase.trip.id
      }));

    } catch (error) {
      console.error('Errore nel recupero dello storico transazioni utente:', error);
      return [];
    }
  }

  static async refundPurchase(purchaseId: string, adminId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const purchase = await prisma.tripPurchase.findUnique({
        where: { id: purchaseId }
      });

      if (!purchase) {
        return { success: false, error: 'Acquisto non trovato' };
      }

      if (purchase.status !== PurchaseStatus.COMPLETED) {
        return { success: false, error: 'Solo gli acquisti completati possono essere rimborsati' };
      }

      await prisma.$transaction([
        prisma.tripPurchase.update({
          where: { id: purchaseId },
          data: {
            status: PurchaseStatus.REFUNDED
          }
        }),
        prisma.tripPurchaseTransaction.create({
          data: {
            purchaseId,
            amount: purchase.amount,
            status: PurchaseStatus.REFUNDED,
            paymentMethod: 'admin_refund',
            failureReason: reason || 'Rimborso amministrativo',
            metadata: {
              adminId,
              refundedAt: new Date().toISOString(),
              reason
            }
          }
        })
      ]);

      return { success: true };

    } catch (error) {
      console.error('Errore nel rimborso dell\'acquisto:', error);
      return { success: false, error: 'Errore interno del server' };
    }
  }

  static async giftTrip(userId: string, tripId: string, adminId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { 
          id: true, 
          price: true, 
          user_id: true,
          status: true,
          title: true
        }
      });

      if (!trip) {
        return { success: false, error: 'Viaggio non trovato' };
      }

      if (trip.user_id === userId) {
        return { success: false, error: 'Non puoi regalare un viaggio al suo proprietario' };
      }

      if (trip.status !== 'Pubblicato') {
        return { success: false, error: 'Questo viaggio non è disponibile' };
      }

      const existingPurchase = await prisma.tripPurchase.findUnique({
        where: {
          userId_tripId: {
            userId,
            tripId
          }
        }
      });

      if (existingPurchase?.status === PurchaseStatus.COMPLETED) {
        return { success: false, error: 'L\'utente ha già acquistato questo viaggio' };
      }

      const now = new Date();
      
      const purchase = await prisma.tripPurchase.upsert({
        where: {
          userId_tripId: {
            userId,
            tripId
          }
        },
        create: {
          userId,
          tripId,
          amount: 0,
          status: PurchaseStatus.COMPLETED,
          paymentMethod: 'admin_gift',
          purchasedAt: now
        },
        update: {
          amount: 0,
          status: PurchaseStatus.COMPLETED,
          paymentMethod: 'admin_gift',
          purchasedAt: now
        }
      });

      await prisma.tripPurchaseTransaction.create({
        data: {
          purchaseId: purchase.id,
          amount: 0,
          status: PurchaseStatus.COMPLETED,
          paymentMethod: 'admin_gift',
          failureReason: reason || 'Regalo amministrativo',
          metadata: {
            adminId,
            giftedAt: now.toISOString(),
            reason,
            originalPrice: Number(trip.price)
          }
        }
      });

      return { success: true };

    } catch (error) {
      console.error('Errore nel regalo del viaggio:', error);
      return { success: false, error: 'Errore interno del server' };
    }
  }

  static async getAllPurchases(page: number = 1, limit: number = 10, filters?: {
    userId?: string;
    tripId?: string;
    status?: PurchaseStatus;
    search?: string;
  }) {
    try {
      const offset = (page - 1) * limit;
      const where: Record<string, unknown> = {};

      if (filters?.userId) {
        where.userId = filters.userId;
      }
      
      if (filters?.tripId) {
        where.tripId = filters.tripId;
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.search) {
        where.OR = [
          {
            user: {
              OR: [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } }
              ]
            }
          },
          {
            trip: {
              title: { contains: filters.search, mode: 'insensitive' }
            }
          }
        ];
      }

      const [purchases, total] = await Promise.all([
        prisma.tripPurchase.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            trip: {
              select: {
                id: true,
                title: true,
                price: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.tripPurchase.count({ where })
      ]);

      return {
        purchases,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('Errore nel recupero degli acquisti:', error);
      return {
        purchases: [],
        pagination: { page: 1, limit, total: 0, pages: 0 }
      };
    }
  }
}