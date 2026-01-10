import { BaseEntity } from "./api.types";

type PermissionAction = "create" | "read" | "update" | "delete";

interface Permissions {
  rooms: PermissionAction[];
  actors: PermissionAction[];
  movies: PermissionAction[];
  comments: PermissionAction[];
}
export interface Role extends BaseEntity {
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  permissions: Permissions;
}
