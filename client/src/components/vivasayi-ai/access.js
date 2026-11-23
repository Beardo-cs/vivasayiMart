// Results are still samples, so only people trying it out see Vivasayi AI:
// test accounts, admins, and admins acting for a farmer.
export const canUseCropHealth = user =>
  !!user && user.userType === 'farmer' && !!(user.isTest || user.isAdmin || user.acting);
