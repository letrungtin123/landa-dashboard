# Cấu trúc thư mục Frontend

Dự án này là một ứng dụng React/Vite. Chức năng **Chatbot** (bao gồm ứng dụng kéo thả trực quan FlowgramAI) được tổ chức thành một domain riêng biệt nằm trong `src`. 

Dưới đây là cấu trúc tổng quan:

```text
frontend/
├── dist/                          # Thư mục build 
├── public/                        # Chứa các tài nguyên tĩnh
├── src/                           # 📂 MÃ NGUỒN CHÍNH
│   │
│   ├── layout/                    # 📐 Layout tổng (Sidebar, Header, Main Wrapper...)
│   ├── chatbot/                   # 🤖 MODULE CHATBOT (Hoạt động độc lập)
│   │   ├── assets/                # Tài nguyên của chatbot (ảnh, icon...)
│   │   ├── components/            # Các UI component chuyên dụng cho Bot
│   │   │   ├── configure/         # Giao diện cấu hình bot
│   │   │   ├── flowgramAI/        # 🛠️ Giao diện kéo thả luồng (Workflow Editor)
│   │   │   │   ├── components/    # (Các công cụ, menu, sidebar trong Editor)
│   │   │   │   ├── hooks/         # Hooks quản lý trạng thái luồng
│   │   │   │   ├── nodes/         # Các node logic (Ai-chat, HTTP, Message...)
│   │   │   │   └── services/      # Các service calls dùng riêng trong Editor
│   │   │   ├── knowledge/         # Quản lý tài liệu / Knowledge Base
│   │   │   ├── training/          # Lịch sử training data
│   │   │   ├── WidgetChat/        # Giao diện Widget Chat để nhúng website JS
│   │   │   └── workflow/          # Trang danh sách quản lý luồng Workflow
│   │   ├── context/               # Quản lý state toàn cục (Supabase cho bot...)
│   │   ├── hooks/                 # Custom Hooks cho chatbot
│   │   ├── pages/                 # Các trang view chính của phân hệ Chatbot
│   │   ├── services/              # Các file gọi API / Backend cho bot
│   │   └── types & utils/         # Định nghĩa Type TypeScript & Helper functions
│   │
│   ├── components/                # 🧩 SHARED COMPONENTS (Dùng chung toàn app)
│   │   ├── permissions/           # Wrapper kiểm tra quyền hiển thị element UI
│   │   ├── providers/             # App Context Providers (QueryClient, Auth...)
│   │   ├── shared/                # Widget / Giao diện chung
│   │   ├── tenants/               # Các file liên quan đến phân hệ Tenant
│   │   ├── ui/                    # Base UI Kit (Button, Input, Modal, Slider...)
│   │   └── users/                 # Component phục vụ phân hệ Users
│   │
│   ├── hooks/                     # Custom Hooks toàn cục hệ thống
│   ├── lib/                       # Các tiện ích và configs (axios, date-fns...)
│   ├── pages/                     # Các luồng trang chính nằm ngoài Chatbot 
│   └── services/                  # Chứa service call chung cho toàn portal
│
├── index.html                     # Entry point HTML của ứng dụng Vite
├── package.json                   # Cấu hình dependency, scripts
├── tsconfig.json                  # Cấu hình TypeScript
├── vite.config.ts                 # Cấu hình Vite tiêu chuẩn
├── vite.config.widget.ts          # Cấu hình build riêng để xuất widget chat
└── vite.config.widget_help_center.ts # Cấu hình build riêng xuất Help Center widget
```

## Các điểm nổi bật:
1. **Kiến trúc Domain-Driven cho Chatbot:** Phần lớn tính năng phức tạp tập trung vào thư mục `src/chatbot`. Nó được thiết kế tự trị và có module riêng để xử lý đồ án luồng (FlowgramAI) cũng như context độc lập.
2. **Build Configurations Đa Dạng**: Có 3 config file Vite, thể hiện việc xuất ứng dụng vừa đóng vai trò là một **Web Portal** quản trị, vừa xuất ra các file **Javascript nhúng (embed script/iframe)**.
3. **Quản lý Phân quyền (Permissions)**: Dự án tách biệt `components/permissions` để thao tác đóng/mở thẻ UI theo Role một cách nhất quán toàn dự án.
