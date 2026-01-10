/**
 * Error Code Enum
 * Quy ước mã lỗi chuẩn cho toàn bộ hệ thống
 * Format: MODULE_ERROR_TYPE
 */
export enum ErrorCode {
  // General Errors (1000-1999)
  INTERNAL_SERVER_ERROR = "ERR_1000",
  VALIDATION_ERROR = "ERR_1001",
  NOT_FOUND = "ERR_1002",
  UNAUTHORIZED = "ERR_1003",
  FORBIDDEN = "ERR_1004",
  BAD_REQUEST = "ERR_1005",

  // Authentication Errors (2000-2099)
  AUTH_INVALID_CREDENTIALS = "ERR_2000",
  AUTH_TOKEN_EXPIRED = "ERR_2001",
  AUTH_TOKEN_INVALID = "ERR_2002",
  AUTH_REFRESH_TOKEN_INVALID = "ERR_2003",
  AUTH_ACCOUNT_INACTIVE = "ERR_2004",
  AUTH_INSUFFICIENT_PERMISSIONS = "ERR_2005",
  AUTH_ACCOUNT_NOT_FOUND = "ERR_2006",
  AUTH_REFRESH_TOKEN_NOT_FOUND = "ERR_2007",
  AUTH_EMAIL_NOT_FOUND = "ERR_2008",
  // User Errors (2100-2199)
  USER_NOT_FOUND = "ERR_2100",
  USER_EMAIL_EXISTS = "ERR_2101",
  USER_USERNAME_EXISTS = "ERR_2102",
  USER_INVALID_PASSWORD = "ERR_2103",
  USER_ALREADY_ACTIVE = "ERR_2104",
  USER_ALREADY_INACTIVE = "ERR_2105",

  // Role Errors (2200-2299)
  ROLE_NOT_FOUND = "ERR_2200",
  ROLE_NAME_EXISTS = "ERR_2201",
  ROLE_IS_DEFAULT = "ERR_2202",
  ROLE_IN_USE = "ERR_2203",

  // Movie Errors (3000-3099)
  MOVIE_NOT_FOUND = "ERR_3000",
  MOVIE_SLUG_EXISTS = "ERR_3001",
  MOVIE_INVALID_TYPE = "ERR_3002",
  MOVIE_TITLE_EXISTS = "ERR_3003",
  MOVIE_INVALID_STATUS = "ERR_3004",
  MOVIE_INVALID_YEAR = "ERR_3005",
  MOVIE_INVALID_DURATION = "ERR_3006",

  // Actor Errors (3100-3199)
  ACTOR_NOT_FOUND = "ERR_3100",
  ACTOR_NAME_EXISTS = "ERR_3101",
  ACTOR_SLUG_EXISTS = "ERR_3102",

  // Director Errors (3200-3299)
  DIRECTOR_NOT_FOUND = "ERR_3200",
  DIRECTOR_NAME_EXISTS = "ERR_3201",
  DIRECTOR_SLUG_EXISTS = "ERR_3202",

  // Country Errors (3300-3399)
  COUNTRY_NOT_FOUND = "ERR_3300",
  COUNTRY_NAME_EXISTS = "ERR_3301",
  COUNTRY_SLUG_EXISTS = "ERR_3302",

  // Genre Errors (3400-3499)
  GENRE_NOT_FOUND = "ERR_3400",
  GENRE_NAME_EXISTS = "ERR_3401",
  GENRE_SLUG_EXISTS = "ERR_3402",

  // Episode Errors (3500-3599)
  EPISODE_NOT_FOUND = "ERR_3500",
  EPISODE_NUMBER_EXISTS = "ERR_3501",
  EPISODE_INVALID_NUMBER = "ERR_3502",
  EPISODE_INVALID_DURATION = "ERR_3503",
  EPISODE_VIDEO_PROCESSING_FAILED = "ERR_3504",

  // Comment Errors (4000-4099)
  COMMENT_NOT_FOUND = "ERR_4000",
  COMMENT_UNAUTHORIZED = "ERR_4001",

  // Room Errors (5000-5099)
  ROOM_NOT_FOUND = "ERR_5000",
  ROOM_FULL = "ERR_5001",
  ROOM_UNAUTHORIZED = "ERR_5002",
  ROOM_BY_CODE_NOT_FOUND = "ERR_5003",
  ROOM_MEMBER_NOT_FOUND = "ERR_5004",
  ROOM_NOT_MEMBER = "ERR_5005",
  ROOM_INVALID_PASSWORD = "ERR_5006",

  // WebSocket Errors (5100-5199)
  WS_NOT_AUTHENTICATED = "ERR_5100",
  WS_INVALID_TOKEN = "ERR_5101",
  WS_CONNECTION_FAILED = "ERR_5102",
  WS_ROOM_NOT_JOINED = "ERR_5103",
  WS_INVALID_EVENT = "ERR_5104",
  WS_PERMISSION_DENIED = "ERR_5105",

  // File Upload Errors (6000-6099)
  FILE_TOO_LARGE = "ERR_6000",
  FILE_INVALID_TYPE = "ERR_6001",
  FILE_UPLOAD_FAILED = "ERR_6002",
}

/**
 * Error Code Messages
 * Mapping giữa error code và message tiếng Việt
 */
export const ErrorCodeMessage: Record<ErrorCode, string> = {
  // General
  [ErrorCode.INTERNAL_SERVER_ERROR]: "Đã có lỗi xảy ra, vui lòng thử lại sau.",
  [ErrorCode.VALIDATION_ERROR]:
    "Dữ liệu không hợp lệ hoặc không đúng định dạng.",
  [ErrorCode.NOT_FOUND]: "Không tìm thấy",
  [ErrorCode.UNAUTHORIZED]: "Chưa đăng nhập",
  [ErrorCode.FORBIDDEN]: "Không có quyền truy cập",
  [ErrorCode.BAD_REQUEST]: "Yêu cầu không hợp lệ.",

  // Authentication
  [ErrorCode.AUTH_INVALID_CREDENTIALS]:
    "Tên đăng nhập hoặc mật khẩu không đúng",
  [ErrorCode.AUTH_TOKEN_EXPIRED]: "Phiên đăng nhập đã hết hạn",
  [ErrorCode.AUTH_TOKEN_INVALID]: "Token không hợp lệ",
  [ErrorCode.AUTH_REFRESH_TOKEN_INVALID]: "Refresh token không hợp lệ",
  [ErrorCode.AUTH_ACCOUNT_INACTIVE]: "Tài khoản đã bị vô hiệu hóa",
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: "Không có quyền thực hiện",
  [ErrorCode.AUTH_ACCOUNT_NOT_FOUND]: "Tài khoản không tồn tại",
  [ErrorCode.AUTH_REFRESH_TOKEN_NOT_FOUND]: "Refresh token không tìm thấy",
  [ErrorCode.AUTH_EMAIL_NOT_FOUND]: "Email không tồn tại trên hệ thống",
  // User
  [ErrorCode.USER_NOT_FOUND]: "Người dùng không tồn tại",
  [ErrorCode.USER_EMAIL_EXISTS]: "Email đã được sử dụng",
  [ErrorCode.USER_USERNAME_EXISTS]: "Tên người dùng đã tồn tại",
  [ErrorCode.USER_INVALID_PASSWORD]: "Mật khẩu không đúng",
  [ErrorCode.USER_ALREADY_ACTIVE]: "Người dùng đã được kích hoạt",
  [ErrorCode.USER_ALREADY_INACTIVE]: "Người dùng đã bị vô hiệu hóa",

  // Role
  [ErrorCode.ROLE_NOT_FOUND]: "Quyền hạn không tồn tại",
  [ErrorCode.ROLE_NAME_EXISTS]: "Tên quyền hạn đã tồn tại",
  [ErrorCode.ROLE_IS_DEFAULT]: "Không thể xóa quyền hạn mặc định",
  [ErrorCode.ROLE_IN_USE]: "Quyền hạn đang được sử dụng",

  // Movie
  [ErrorCode.MOVIE_NOT_FOUND]: "Phim không tồn tại",
  [ErrorCode.MOVIE_SLUG_EXISTS]: "Slug phim đã tồn tại",
  [ErrorCode.MOVIE_INVALID_TYPE]: "Loại phim không hợp lệ",
  [ErrorCode.MOVIE_TITLE_EXISTS]: "Tiêu đề phim đã tồn tại",
  [ErrorCode.MOVIE_INVALID_STATUS]: "Trạng thái phim không hợp lệ",
  [ErrorCode.MOVIE_INVALID_YEAR]: "Năm phát hành không hợp lệ",
  [ErrorCode.MOVIE_INVALID_DURATION]: "Thời lượng phim không hợp lệ",

  // Actor
  [ErrorCode.ACTOR_NOT_FOUND]: "Diễn viên không tồn tại",
  [ErrorCode.ACTOR_NAME_EXISTS]: "Tên diễn viên đã tồn tại",
  [ErrorCode.ACTOR_SLUG_EXISTS]: "Slug diễn viên đã tồn tại",

  // Director
  [ErrorCode.DIRECTOR_NOT_FOUND]: "Đạo diễn không tồn tại",
  [ErrorCode.DIRECTOR_NAME_EXISTS]: "Tên đạo diễn đã tồn tại",
  [ErrorCode.DIRECTOR_SLUG_EXISTS]: "Slug đạo diễn đã tồn tại",

  // Country
  [ErrorCode.COUNTRY_NOT_FOUND]: "Quốc gia không tồn tại",
  [ErrorCode.COUNTRY_NAME_EXISTS]: "Tên quốc gia đã tồn tại",
  [ErrorCode.COUNTRY_SLUG_EXISTS]: "Slug quốc gia đã tồn tại",

  // Genre
  [ErrorCode.GENRE_NOT_FOUND]: "Thể loại không tồn tại",
  [ErrorCode.GENRE_NAME_EXISTS]: "Tên thể loại đã tồn tại",
  [ErrorCode.GENRE_SLUG_EXISTS]: "Slug thể loại đã tồn tại",

  // Episode
  [ErrorCode.EPISODE_NOT_FOUND]: "Tập phim không tồn tại",
  [ErrorCode.EPISODE_NUMBER_EXISTS]: "Số tập đã tồn tại",
  [ErrorCode.EPISODE_INVALID_NUMBER]: "Số tập không hợp lệ",
  [ErrorCode.EPISODE_INVALID_DURATION]: "Thời lượng tập phim không hợp lệ",
  [ErrorCode.EPISODE_VIDEO_PROCESSING_FAILED]: "Xử lý video thất bại",

  // Comment
  [ErrorCode.COMMENT_NOT_FOUND]: "Bình luận không tồn tại",
  [ErrorCode.COMMENT_UNAUTHORIZED]: "Không có quyền sửa/xóa bình luận",

  // Room
  [ErrorCode.ROOM_NOT_FOUND]: "Phòng không tồn tại",
  [ErrorCode.ROOM_FULL]: "Phòng đã đầy",
  [ErrorCode.ROOM_UNAUTHORIZED]: "Không có quyền truy cập phòng",
  [ErrorCode.ROOM_BY_CODE_NOT_FOUND]: "Không tìm thấy phòng với mã đã cho",
  [ErrorCode.ROOM_MEMBER_NOT_FOUND]: "Thành viên phòng không tồn tại",
  [ErrorCode.ROOM_NOT_MEMBER]: "Bạn không phải là thành viên của phòng này",
  [ErrorCode.ROOM_INVALID_PASSWORD]: "Mật khẩu phòng không đúng",

  // WebSocket
  [ErrorCode.WS_NOT_AUTHENTICATED]: "Chưa xác thực WebSocket",
  [ErrorCode.WS_INVALID_TOKEN]: "Token WebSocket không hợp lệ",
  [ErrorCode.WS_CONNECTION_FAILED]: "Kết nối WebSocket thất bại",
  [ErrorCode.WS_ROOM_NOT_JOINED]: "Bạn chưa tham gia phòng",
  [ErrorCode.WS_INVALID_EVENT]: "Sự kiện WebSocket không hợp lệ",
  [ErrorCode.WS_PERMISSION_DENIED]: "Không có quyền thực hiện hành động này",

  // File Upload
  [ErrorCode.FILE_TOO_LARGE]: "File quá lớn",
  [ErrorCode.FILE_INVALID_TYPE]: "Định dạng file không hợp lệ",
  [ErrorCode.FILE_UPLOAD_FAILED]: "Tải file lên thất bại",
};
