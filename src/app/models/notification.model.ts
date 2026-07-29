export interface FieldChange {
  fieldName: string;
  oldValue: string;
  newValue: string;
}

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorEmail: string;
  actorId: string;
  organizationId: string;
  entityLabel: string;
  message: string;
  changes: FieldChange[];
  timestamp: string;
  read: boolean;
}
