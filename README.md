# HALO Sales Dashboard Web App

Ứng dụng quản lý doanh số và báo cáo thông minh dành cho HALO Education.

## 🚀 Hướng dẫn triển khai

### Bước 1: Cấu hình Google Apps Script (GAS)
1. Mở dự án GAS của bạn.
2. Đảm bảo file `UiHandler.js` đã có hàm `doGet(e)` (đã tự động thêm).
3. Chọn **Deploy** > **New Deployment**.
4. Chọn loại là **Web App**.
5. Cấu hình:
   - **Description**: API for Dashboard WebApp
   - **Execute as**: Me (Tài khoản của bạn)
   - **Who has access**: Anyone
6. Nhấn **Deploy**. Sau khi hoàn tất, hãy copy **Web App URL**.

### Bước 2: Cấu hình Web App
1. Mở file `src/config.js` trong thư mục `halo_dashboard_webapp`.
2. Dán URL đã copy vào biến `API_URL`.

### Bước 3: Đưa lên GitHub
1. Tạo một repository mới trên GitHub (ví dụ: `halo-dashboard`).
2. Mở terminal tại thư mục này và chạy:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tanluandiep/halo-dashboard.git
   git push -u origin main
   ```

### Bước 4: Triển khai lên Vercel
1. Truy cập [Vercel](https://vercel.com).
2. Nhấn **Add New** > **Project**.
3. Import repository từ GitHub.
4. Vercel sẽ tự động nhận diện dự án Vite. Nhấn **Deploy**.

## 📱 Tính năng nổi bật
- **Responsive**: Giao diện tương thích hoàn hảo trên Mobile, Tablet và Desktop.
- **Dark Mode Premium**: Thiết kế hiện đại với hiệu ứng Glassmorphism.
- **Real-time Data**: Kết nối trực tiếp với Google Sheets.
- **Reporting**: Chụp ảnh báo cáo sắc nét để chia sẻ nhanh.

---
Phát triển bởi Antigravity AI.
