export interface Actor {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  biography?: string | null;
  profileImageUrl?: string | null;
  dateOfBirth?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}
