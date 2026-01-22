export const resolveAlertState = ({
  currentStockInBase,
  lowInBase,
  criticalInBase,
}) => {
  if (currentStockInBase <= criticalInBase) return "CRITICAL";
  if (currentStockInBase <= lowInBase) return "LOW";
  return "OK";
};
