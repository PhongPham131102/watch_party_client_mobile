import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoomStore } from "@/store/room.store";
import { useAuthStore } from "@/store/auth.store";
import { roomSocketService } from "@/services/room-socket.service";
import Toast from "react-native-toast-message";
import { useLocalSearchParams } from "expo-router";

export default function ChatTab() {
  const { id: roomCode } = useLocalSearchParams<{ id: string }>();
  const { messages, hasMoreMessages, loadMoreMessages } = useRoomStore();
  const { user } = useAuthStore();

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // For inverted FlatList, data should be in newest -> oldest order
  const reversedMessages = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  const handleLoadMore = async () => {
    // In an inverted list, reaching the 'end' means reaching the oldest messages (top of screen)
    if (isLoadingMore || !hasMoreMessages || !roomCode) return;

    setIsLoadingMore(true);
    try {
      await loadMoreMessages();
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      // Small cooldown to let the list data settle
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 500);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !roomCode || isSending) return;

    const messageContent = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      await roomSocketService.sendMessage(roomCode, messageContent);
      // Inverted list automatically stays at the bottom (newest) when a new item is added to the start of data
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Lỗi gửi tin nhắn",
        text2: error.message || "Không thể gửi tin nhắn",
      });
      setInputText(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const renderMessage = useCallback(
    ({ item }: { item: any }) => {
      const messageUser =
        typeof item.sender === "object"
          ? item.sender
          : typeof item.user === "object"
          ? item.user
          : null;
      const currentUserId = typeof user === "object" ? user?.id : user;
      const isOwnMessage = messageUser?.id === currentUserId;
      const displayName =
        messageUser?.profile?.fullName ||
        messageUser?.username ||
        item.username ||
        "Người dùng";
      const avatarUrl = messageUser?.profile?.avatarUrl;
      const messageTime = formatTime(item.sentAt || item.createdAt);
      const isSystemMessage = item.type === "system";

      if (isSystemMessage) {
        return (
          <View style={styles.systemMessageContainer}>
            <Text style={styles.systemMessageText}>{item.content}</Text>
          </View>
        );
      }

      return (
        <View
          style={
            isOwnMessage
              ? styles.ownMessageContainer
              : styles.otherMessageContainer
          }
        >
          {!isOwnMessage && (
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {getInitials(displayName)}
                  </Text>
                </View>
              )}
            </View>
          )}
          <View
            style={
              isOwnMessage
                ? styles.ownMessageContent
                : styles.otherMessageContent
            }
          >
            <View
              style={
                isOwnMessage
                  ? styles.ownMessageHeader
                  : styles.otherMessageHeader
              }
            >
              {!isOwnMessage && (
                <Text style={styles.otherMessageName}>{displayName}</Text>
              )}
              <Text
                style={
                  isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
                }
              >
                {messageTime}
              </Text>
              {isOwnMessage && <Text style={styles.ownMessageName}>Bạn</Text>}
            </View>
            <View style={isOwnMessage ? styles.ownBubble : styles.otherBubble}>
              <Text
                style={
                  isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                }
              >
                {item.content}
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [user]
  );

  const renderFooter = () => {
    // In an inverted list, the Footer is actually at the TOP of the screen
    if (isLoadingMore) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#ef4444" />
          <Text style={styles.loadingText}>Đang tải tin nhắn cũ...</Text>
        </View>
      );
    }
    if (!hasMoreMessages && messages.length > 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.headerText}>Đã tải hết lịch sử chat</Text>
        </View>
      );
    }
    return null;
  };

  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const videoHeight = (screenWidth * 9) / 16;
  const headerHeight = 60; // Approximate height of room header
  const tabsHeight = 50; // Approximate height of tabs bar

  // Calculate total offset from top: notch + room header + video + tabs
  const keyboardOffset =
    Platform.OS === "ios"
      ? insets.top + headerHeight + videoHeight + tabsHeight - 10
      : 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardOffset}
    >
      <FlatList
        ref={flatListRef}
        data={reversedMessages}
        inverted
        keyExtractor={(item, index) =>
          item.id || `msg-${index}-${item.createdAt}`
        }
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
            <Text style={styles.emptySubtext}>
              Hãy là người đầu tiên gửi tin nhắn!
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#6b7280"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!isSending}
        />
        <Pressable
          style={[
            styles.sendButton,
            (!inputText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isSending}
        >
          <Ionicons
            name="send"
            size={20}
            color={!inputText.trim() || isSending ? "#6b7280" : "#fff"}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0f14",
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  headerContainer: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  loadingContainer: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  headerText: {
    color: "#4b5563",
    fontSize: 12,
  },
  loadMoreText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 13,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 4,
  },
  ownMessageContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  ownMessageContent: {
    maxWidth: "75%",
    alignItems: "flex-end",
  },
  ownMessageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  ownMessageName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  ownMessageTime: {
    color: "#6b7280",
    fontSize: 11,
  },
  ownBubble: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  ownMessageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  otherMessageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  avatarContainer: {
    width: 32,
    height: 32,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  otherMessageContent: {
    flex: 1,
    maxWidth: "75%",
  },
  otherMessageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  otherMessageName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  otherMessageTime: {
    color: "#6b7280",
    fontSize: 11,
  },
  otherBubble: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  otherMessageText: {
    color: "#e5e7eb",
    fontSize: 15,
    lineHeight: 20,
  },
  systemMessageContainer: {
    alignSelf: "center",
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
  },
  systemMessageText: {
    color: "#9ca3af",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#1a1b20",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  input: {
    flex: 1,
    backgroundColor: "#0e0f14",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#374151",
  },
});
