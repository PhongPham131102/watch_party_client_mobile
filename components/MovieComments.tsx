import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  MessageCircle,
  Send,
  Trash2,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuthStore } from "@/store/auth.store";
import { commentService } from "@/services/comment.service";
import { Comment } from "@/types/comment.types";
import Toast from "react-native-toast-message";

interface CommentItemProps {
  comment: Comment;
  onReplySubmit: (parentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  isReply?: boolean;
  level?: number;
}

function CommentItem({
  comment,
  onReplySubmit,
  onDelete,
  isReply = false,
  level = 0,
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(comment._count?.replies || 0);

  const currentUserId = typeof user === "string" ? user : user?.id;
  const canDelete = currentUserId === comment.userId;

  const loadReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    setLoadingReplies(true);
    try {
      const data = await commentService.getReplies(comment.id);
      setReplies(data);
      setShowReplies(true);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải phản hồi",
      });
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await onReplySubmit(comment.id, replyContent.trim());
      setReplyContent("");
      setShowReplyForm(false);
      setReplyCount((prev) => prev + 1);

      // Reload replies
      const data = await commentService.getReplies(comment.id);
      setReplies(data);
      setShowReplies(true);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể gửi phản hồi",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Xóa bình luận", "Bạn có chắc chắn muốn xóa bình luận này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await onDelete(comment.id);
          } catch (error) {
            Toast.show({
              type: "error",
              text1: "Lỗi",
              text2: "Không thể xóa bình luận",
            });
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <View style={[styles.commentItem, level > 0 && styles.replyItem]}>
      <View style={styles.commentHeader}>
        {comment.user?.profile?.avatarUrl ? (
          <Image
            source={{ uri: comment.user.profile.avatarUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>
              {comment.user?.username?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
        )}
        <View style={styles.commentInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.fullName}>
              {comment.user?.profile?.fullName ||
                comment.user?.username ||
                "Người dùng"}
            </Text>
            <Text style={styles.timeText}>{timeAgo}</Text>
          </View>
          <Text style={styles.content}>{comment.content}</Text>

          <View style={styles.actions}>
            {level === 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowReplyForm(!showReplyForm)}
              >
                <CornerDownRight size={14} color="#9ca3af" />
                <Text style={styles.actionText}>
                  {showReplyForm ? "Hủy" : "Trả lời"}
                </Text>
              </TouchableOpacity>
            )}

            {level === 0 && replyCount > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={loadReplies}
              >
                {showReplies ? (
                  <ChevronUp size={14} color="#9ca3af" />
                ) : (
                  <ChevronDown size={14} color="#9ca3af" />
                )}
                <Text style={styles.actionText}>
                  {loadingReplies ? "Đang tải..." : `${replyCount} phản hồi`}
                </Text>
              </TouchableOpacity>
            )}

            {canDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Trash2 size={14} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>

          {showReplyForm && (
            <View style={styles.replyForm}>
              <TextInput
                style={styles.replyInput}
                placeholder="Viết phản hồi..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={replyContent}
                onChangeText={setReplyContent}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.miniSendButton,
                  !replyContent.trim() && styles.disabledButton,
                ]}
                onPress={handleReplySubmit}
                disabled={submitting || !replyContent.trim()}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Send size={16} color="white" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {showReplies && replies.length > 0 && (
        <View style={styles.repliesList}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
              isReply={true}
              level={level + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function MovieComments({ movieId }: { movieId: string }) {
  const { isAuthenticated, user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const hasMore = page * limit < total;

  const loadComments = useCallback(
    async (pageNum: number = 1) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const response = await commentService.getMovieComments(
          movieId,
          pageNum,
          limit
        );

        if (pageNum === 1) {
          setComments(response.data);
        } else {
          setComments((prev) => [...prev, ...response.data]);
        }

        setTotal(response.meta.total);
        setPage(pageNum);
      } catch (error) {
        console.error("Load comments error:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [movieId]
  );

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    if (!content.trim() || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const newComment = await commentService.createComment({
        movieId,
        content: content.trim(),
      });

      // Optimistic update
      const fullComment: Comment = {
        ...newComment,
        user: user!,
        _count: { replies: 0 },
      };

      setComments((prev) => [fullComment, ...prev]);
      setTotal((prev) => prev + 1);
      setContent("");
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã đăng bình luận",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể đăng bình luận",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((prev) => Math.max(0, prev - 1));
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã xóa bình luận",
      });
    } catch (error) {
      throw error;
    }
  };

  const handleReplySubmit = async (parentId: string, replyContent: string) => {
    await commentService.createComment({
      movieId,
      content: replyContent,
      parentCommentId: parentId,
    });
    // Count update logic is handled inside CommentItem re-fetch
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MessageCircle size={20} color="#ef4444" />
        <Text style={styles.title}>Bình luận ({total})</Text>
      </View>

      {isAuthenticated ? (
        <View style={styles.inputSection}>
          <TextInput
            style={styles.mainInput}
            placeholder="Viết bình luận của bạn..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={1000}
          />
          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>{content.length}/1000</Text>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!content.trim() || submitting) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={submitting || !content.trim()}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Send size={16} color="white" />
                  <Text style={styles.sendText}>Gửi</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.loginBanner}>
          <Text style={styles.loginText}>Vui lòng đăng nhập để bình luận</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#ef4444" style={styles.loader} />
      ) : comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReplySubmit={handleReplySubmit}
              onDelete={handleDeleteComment}
            />
          ))}

          {hasMore && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => loadComments(page + 1)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
              ) : (
                <Text style={styles.loadMoreText}>Xem thêm bình luận</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  inputSection: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 24,
  },
  mainInput: {
    color: "white",
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  charCount: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
  },
  sendButton: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sendText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  loginBanner: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  loginText: {
    color: "#9ca3af",
  },
  loader: {
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#4b5563",
    fontSize: 14,
  },
  list: {
    gap: 16,
    paddingBottom: 40,
  },
  commentItem: {
    marginBottom: 8,
  },
  replyItem: {
    marginLeft: 40,
    marginTop: 12,
  },
  commentHeader: {
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  commentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 4,
  },
  fullName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  timeText: {
    color: "#6b7280",
    fontSize: 12,
  },
  content: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    marginLeft: "auto",
  },
  replyForm: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  replyInput: {
    flex: 1,
    color: "white",
    fontSize: 13,
    maxHeight: 60,
  },
  miniSendButton: {
    backgroundColor: "#ef4444",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  repliesList: {
    marginTop: 8,
  },
  loadMoreButton: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginTop: 10,
  },
  loadMoreText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
  },
});
