# Thumb Desk

Giao diện làm thumbnail gọn dành cho dữ liệu từ Idea Chic. Ứng dụng tập trung vào danh sách thẻ trong ngày, lọc theo kênh/niche, tải nội dung TXT, xem ảnh, kéo thả ảnh và gửi thumbnail.

## Bản đang chạy

- Live demo: https://idea-chic-thumb-desk-v2-2026.social-snow-1874.chatgpt.site/
- Phiên bản khởi tạo GitHub: `1.0.0`
- Tag: `v1.0.0`
- Ngày cập nhật: `16/11/2026`

## Chức năng chính

- Lọc thẻ theo ngày, kênh, niche và trạng thái thumbnail.
- Tìm theo mã kênh, số thẻ hoặc mã đầy đủ.
- Click mã thẻ hoặc tiêu đề để copy.
- Tải bài viết thành tệp TXT.
- Kéo thả ảnh để upload và gửi thumbnail.
- Xem ảnh toàn màn hình, chuyển ảnh bằng nút điều hướng hoặc bàn phím.
- Hiển thị trạng thái QC: PASS, đang QC, số lỗi, QC hết hiệu lực và QC lỗi.
- Bố cục responsive từ 1 đến 4 thẻ trên một dòng.

## Chạy trên máy

Đây là ứng dụng HTML/CSS/JavaScript thuần, không cần bước build.

```bash
python -m http.server 8080 --directory dist
```

Sau đó mở `http://localhost:8080` và nhập Radar API key của tài khoản được cấp quyền.

## Bảo mật API key

- Không ghi API key vào mã nguồn, commit hoặc GitHub Issues.
- API key được người dùng nhập khi chạy và lưu trong bộ nhớ trình duyệt của chính máy đó.
- Mỗi người dùng cần API key/quyền truy cập riêng từ hệ thống Idea Chic.

## Cấu trúc

```text
dist/
  index.html              Giao diện chính
  styles.css              Toàn bộ style responsive
  app.js                  Mã JavaScript nguồn đang dùng
  app-qc-20261116.js      Bundle trình duyệt được index.html nạp
```

## Cập nhật tự động

Repo này là nền tảng để bổ sung kiểm tra phiên bản qua GitHub Releases. Bản hiện tại chưa tự ghi đè file trên máy; chức năng cập nhật một nút sẽ được triển khai ở bước đóng gói web/PWA hoặc ứng dụng Windows.

## Ghi chú

Tệp cấu hình hosting riêng của chủ dự án không được đưa lên GitHub. Khi fork repo, bạn có thể triển khai thư mục `dist/` lên bất kỳ dịch vụ static hosting nào phù hợp.
