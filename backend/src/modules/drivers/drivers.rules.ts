import { Driver, DriverStatus } from '@prisma/client';

type DriverEligibility = Pick<Driver, 'status' | 'licenseExpiry'>;

/** Dates supplied by the UI are calendar dates, so compare them at the start of the UTC day. */
export const startOfToday = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/** A license expiring today remains valid through the end of today. */
export const isLicenseExpired = (licenseExpiry: Date, today = startOfToday()) => licenseExpiry < today;

/** Shared eligibility rule for the driver list, trip options, and dispatch. */
export const isDriverAssignable = (driver: DriverEligibility, today = startOfToday()) =>
  driver.status !== DriverStatus.SUSPENDED &&
  driver.status !== DriverStatus.OFF_DUTY &&
  !isLicenseExpired(driver.licenseExpiry, today);

export const toDriverResponse = (driver: Driver) => {
  const today = startOfToday();
  return {
    ...driver,
    licenseExpired: isLicenseExpired(driver.licenseExpiry, today),
    assignable: isDriverAssignable(driver, today),
  };
};
