export const formatPKR = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'PKR 0'
  return `PKR ${Number(amount).toLocaleString('en-PK')}`
}
