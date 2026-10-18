export interface AdminNotification {
  readonly id: string;
  readonly serviceCode: string;
  readonly title: string;
  readonly message: string;
  readonly createdAt: string;
  readonly read: boolean;
}
