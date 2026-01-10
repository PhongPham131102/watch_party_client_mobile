import { apiClient } from "./api.service";
import {
  Comment,
  CreateCommentDto,
  CommentResponse,
} from "../types/comment.types";

class CommentService {
  private readonly BASE_URL = "/comments";

  async createComment(dto: CreateCommentDto): Promise<Comment> {
    const response = await apiClient.post<any>(this.BASE_URL, dto);
    return response.data;
  }

  async getMovieComments(
    movieId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<CommentResponse> {
    const response = await apiClient.get<any>(
      `${this.BASE_URL}/movie/${movieId}?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  async getReplies(commentId: string): Promise<Comment[]> {
    const response = await apiClient.get<any>(
      `${this.BASE_URL}/${commentId}/replies`
    );
    return response.data;
  }

  async deleteComment(commentId: string): Promise<boolean> {
    const response = await apiClient.delete<any>(
      `${this.BASE_URL}/${commentId}`
    );
    return response.data;
  }
}

export const commentService = new CommentService();
