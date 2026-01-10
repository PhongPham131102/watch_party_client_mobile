import { User } from "./auth.types";
import { PaginationMeta } from "./api.types";

export interface Comment {
  id: string;
  content: string;
  userId: string;
  movieId: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

export interface CreateCommentDto {
  movieId: string;
  content: string;
  parentCommentId?: string;
}

export interface CommentResponse {
  data: Comment[];
  meta: PaginationMeta;
}
