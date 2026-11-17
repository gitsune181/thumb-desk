# Thumb Desk Web

Thumb Desk là công cụ web portable dành cho quy trình làm thumbnail từ dữ liệu Idea Chic: lọc thẻ trong ngày, xem ảnh, kéo thả ảnh, gửi thumbnail và theo dõi trạng thái QC.

## Dùng ngay

### Cách 1 — mở trực tiếp trên web

Mở [Thumb Desk Web](https://idea-chic-thumb-desk-v2-2026.social-snow-1874.chatgpt.site), nhập API key Idea Chic cá nhân lần đầu rồi sử dụng.

### Cách 2 — dùng một file portable

1. Vào [Releases](https://github.com/gitsune181/thumb-desk/releases/latest).
2. Tải `Thumb-Desk-Web.html`.
3. Bấm đúp file; Thumb Desk mở ngay trong Chrome hoặc Edge.
4. Nhập API key Idea Chic cá nhân khi giao diện hỏi lần đầu.

Không cần cài đặt, giải nén, quyền Administrator hoặc chạy server. Toàn bộ HTML, CSS và JavaScript nằm trong một file duy nhất. Công cụ vẫn cần Internet để kết nối `idea.chicsdata.shop` và tải dữ liệu/ảnh.

## Phiên bản

- Web: `1.1.0`
- Tag: `v1.1.0`
- Ngày cập nhật: `17/11/2026`

## Chức năng chính

- Lọc thẻ theo ngày, kênh, niche và trạng thái thumbnail.
- Tìm theo mã kênh, số thẻ hoặc mã đầy đủ.
- Click mã thẻ hoặc tiêu đề để copy.
- Tải bài viết thành tệp TXT.
- Kéo thả ảnh để upload và gửi thumbnail.
- Xem ảnh toàn màn hình và chuyển ảnh bằng bàn phím.
- Hiển thị trạng thái QC: PASS, đang QC, lỗi và QC hết hiệu lực.
- Bố cục responsive từ 1 đến 4 thẻ trên một dòng.

## API key

- Mỗi người dùng API key Idea Chic của chính mình.
- Không ghi API key vào mã nguồn, GitHub hoặc nhóm chat.
- Key được lưu cục bộ trong trình duyệt trên máy của người dùng.
- Đổi máy, đổi trình duyệt hoặc xóa dữ liệu trình duyệt có thể yêu cầu nhập key lại.

## Phát triển

Yêu cầu Node.js 22 trở lên.

```bash
npm run check
npm run build:web-portable
```

File phát hành được tạo tại `release/Thumb-Desk-Web.html`. Khi push tag dạng `v*`, GitHub Actions kiểm tra nguồn, tạo file portable và cập nhật GitHub Release tương ứng.

## Cấu trúc

```text
dist/index.html              Giao diện web
dist/styles.css              Kiểu hiển thị
dist/app.js                  Logic ứng dụng
scripts/build-portable-web.cjs  Ghép thành một file HTML portable
.github/workflows/release.yml   Quy trình phát hành web
```

Tệp cấu hình hosting riêng của chủ dự án không được đưa lên GitHub.
