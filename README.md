# Thumb Desk

Ứng dụng Windows gọn dành cho quy trình làm thumbnail từ dữ liệu Idea Chic: lọc thẻ trong ngày, xem ảnh, kéo thả ảnh, gửi thumbnail và theo dõi trạng thái QC.

## Cài đặt trong một lần bấm

1. Mở trang [Releases](https://github.com/gitsune181/thumb-desk/releases/latest).
2. Tải file `Thumb-Desk-Setup-1.1.0.exe`.
3. Bấm đúp file vừa tải. Bộ cài tự cài theo tài khoản Windows, tạo shortcut **Thumb Desk** ngoài Desktop/Start Menu và tự mở ứng dụng.

Phiên bản đầu tiên chưa ký số nên Windows SmartScreen có thể hiện **Unknown publisher**. Khi đó chọn **More info → Run anyway**. Các bản sau có thể ký số để bỏ cảnh báo này.

## Phiên bản

- App: `1.1.0`
- Tag: `v1.1.0`
- Ngày cập nhật: `17/11/2026`
- Live web: https://idea-chic-thumb-desk-v2-2026.social-snow-1874.chatgpt.site/

## Chức năng chính

- Lọc thẻ theo ngày, kênh, niche và trạng thái thumbnail.
- Tìm theo mã kênh, số thẻ hoặc mã đầy đủ.
- Click mã thẻ hoặc tiêu đề để copy.
- Tải bài viết thành tệp TXT.
- Kéo thả ảnh để upload và gửi thumbnail.
- Xem ảnh toàn màn hình, chuyển ảnh bằng nút điều hướng hoặc bàn phím.
- Hiển thị trạng thái QC: PASS, đang QC, số lỗi, QC hết hiệu lực và QC lỗi.
- Bố cục responsive từ 1 đến 4 thẻ trên một dòng.
- Hiển thị phiên bản, tag, ngày cập nhật và cập nhật từ GitHub Releases ngay trong app.

## Bảo mật API key

- Không ghi API key vào mã nguồn, commit hoặc GitHub Issues.
- Trong ứng dụng Windows, key được mã hóa bằng Windows `safeStorage` và chỉ lưu trên máy của người dùng.
- Mỗi người dùng cần API key/quyền truy cập riêng từ hệ thống Idea Chic.

## Chạy bản web từ mã nguồn

```bash
python -m http.server 8080 --directory dist
```

Sau đó mở `http://localhost:8080`.

## Phát triển và đóng gói

Yêu cầu Node.js 22 trở lên.

```bash
npm install
npm run check
npm start
npm run dist:win
```

Bộ cài và metadata cập nhật được tạo trong `release/`. Khi push tag dạng `v*`, GitHub Actions sẽ build bộ cài Windows và tạo GitHub Release gồm installer, `latest.yml` và blockmap.

## Cấu trúc

```text
dist/                  Giao diện HTML/CSS/JavaScript
electron/main.cjs      Cửa sổ app, safeStorage và auto-update
electron/preload.cjs   Cầu nối API desktop giới hạn
build/icon.svg         Icon ứng dụng
.github/workflows/     Quy trình phát hành Windows
```

Tệp cấu hình hosting riêng của chủ dự án không được đưa lên GitHub.
