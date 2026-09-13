export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  UPI = 'UPI',
  CARD = 'CARD',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  DUE = 'DUE',
}

export enum PaymentType {
  RECEIVED = 'RECEIVED',
  SENT = 'SENT',
}
