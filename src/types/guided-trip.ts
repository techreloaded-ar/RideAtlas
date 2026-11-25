// Tipi condivisi tra servizio, API e interfaccia dei viaggi guidati.

import type { GuidedTripBookingStatus, GuidedTripStatus } from '@prisma/client';

export interface GuidedTripListItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  meetingPoint: string;
  pricePerPerson: number;
  maxParticipants: number;
  remainingSeats: number;
  organizerName: string;
}

export interface GuidedTripDetail extends GuidedTripListItem {
  description: string;
  status: GuidedTripStatus;
  cancellationReason: string | null;
  organizerId: string;
  linkedTrip: { title: string; slug: string } | null;
  linkedTripId: string | null;
  participantCancellationDeadline: string;
  bookable: boolean;
  viewerIsOrganizer: boolean;
  viewerCanManage: boolean;
  viewerHasConfirmedBooking: boolean;
}

export interface LinkableTripOption {
  id: string;
  title: string;
  authorName: string;
}

export interface GuidedTripParticipant {
  bookingId: string;
  name: string;
  email: string;
  confirmedAt: string;
}

export interface GuidedTripOrganizerView {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: GuidedTripStatus;
  pricePerPerson: number;
  maxParticipants: number;
  occupiedSeats: number;
  confirmedRevenue: number;
  cancellationReason: string | null;
  canBeCancelled: boolean;
  participants: GuidedTripParticipant[];
}

export interface GuidedTripBookingSummary {
  id: string;
  status: GuidedTripBookingStatus;
  amount: number;
  confirmedAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  refundPending: boolean;
  guidedTripId: string;
  title: string;
  startDate: string;
  endDate: string;
  meetingPoint: string;
  organizerName: string;
  cancellationReason: string | null;
  cancellationDeadline: string;
  canCancel: boolean;
}

export interface GuidedTripFormValues {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  meetingPoint: string;
  pricePerPerson: number;
  maxParticipants: number;
  linkedTripId: string | null;
}
