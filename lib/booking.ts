/**
 * Booking link configuration.
 *
 * Set NEXT_PUBLIC_BOOKING_URL to your Google Calendar Appointment
 * Scheduling page URL (the public one clients book through, e.g.
 * https://calendar.google.com/calendar/appointments/schedules/AcZ...).
 * When it is empty, the booking page and "Book a call" buttons gracefully
 * hide / show a placeholder.
 */
export function getBookingUrl(): string {
  return (process.env.NEXT_PUBLIC_BOOKING_URL ?? "").trim();
}

export function isBookingConfigured(): boolean {
  return getBookingUrl().length > 0;
}
