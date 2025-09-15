# Hướng Dẫn Debug Extension TTS

## Các vấn đề đã được sửa:

### 1. ✅ Lỗi JSON trong steps.json

- **Vấn đề**: File steps.json bị lỗi format
- **Đã sửa**: Tạo lại file steps.json với format đúng

### 2. ✅ Thiếu kiểm tra validateStep function

- **Vấn đề**: Code gọi validateStep mà không kiểm tra function có tồn tại không
- **Đã sửa**: Thêm kiểm tra `typeof validateStep === 'function'`

### 3. ✅ Manifest không support localhost để test

- **Vấn đề**: Extension chỉ chạy trên website chính thức
- **Đã sửa**: Thêm permission cho file://, localhost

### 4. ✅ Thêm test pages

- **Đã tạo**: test-extension.html và test-local.html

## Hướng dẫn test từng bước:

### Bước 1: Load Extension vào Chrome

1. Mở Chrome và gõ `chrome://extensions/`
2. Bật "Developer mode" ở góc trên bên phải
3. Click "Load unpacked"
4. Chọn thư mục `/Users/thanh/Documents/ai-demo/extension_popup`
5. Extension sẽ xuất hiện với tên "Hướng Dẫn Dịch Vụ Công"

### Bước 2: Test cơ bản

1. Mở file `test-extension.html` trong Chrome:
   ```
   file:///Users/thanh/Documents/ai-demo/extension_popup/test-extension.html
   ```
2. Click "Kiểm tra Extension" - phải thấy ✅ các module đã load
3. Test TTS bằng các nút test

### Bước 3: Test với trang giả lập

1. Mở file `test-local.html`:
   ```
   file:///Users/thanh/Documents/ai-demo/extension_popup/test-local.html
   ```
2. Click icon extension trong Chrome toolbar
3. Bật "Enable Tutorial" và "Enable Speech"
4. Tutorial sẽ tự động hiện và đọc tiếng Việt

### Bước 4: Test trên website thật

1. Truy cập: https://dichvucong.bocongan.gov.vn/bo-cong-an/tiep-nhan-online/chon-truong-hop-ho-so
2. Click icon extension
3. Bật tutorial và speech
4. Tutorial sẽ hướng dẫn từng bước

## Các lệnh debug trong Console:

### Kiểm tra extension load:

```javascript
// Kiểm tra TTS module
typeof TextToSpeechModule !== "undefined";

// Kiểm tra validate function
typeof validateStep !== "undefined";

// Test TTS trực tiếp
const tts = new TextToSpeechModule();
tts.speak("Xin chào");
```

### Kiểm tra lỗi:

```javascript
// Xem console errors
console.clear();

// Check extension scripts
console.log("Scripts loaded:", {
  tts: typeof TextToSpeechModule,
  validate: typeof validateStep,
  tutorial: typeof chrome !== "undefined",
});
```

## Các file quan trọng:

- `manifest.json` - Cấu hình extension
- `scripts/text-to-speech.js` - Module TTS
- `scripts/content.js` - Script chính xử lý tutorial
- `scripts/validate.js` - Validation functions
- `steps.json` - Cấu hình các bước tutorial
- `popup/popup.html` - Giao diện popup
- `styles/styles.css` - CSS cho tutorial overlays

## Troubleshooting thường gặp:

### 🔍 Extension không load:

- Kiểm tra Console có lỗi không
- Refresh extension trong chrome://extensions/
- Reload trang web

### 🔍 TTS không hoạt động:

- Kiểm tra browser có hỗ trợ Speech Synthesis không
- Thử với Chrome version mới nhất
- Check microphone permission

### 🔍 Tutorial không hiện:

- Kiểm tra URL có match với pattern trong steps.json không
- Check console có lỗi load steps.json không
- Verify popup settings đã bật tutorial chưa

### 🔍 Vietnamese speech không hoạt động:

- Kiểm tra browser có Vietnamese voices không:
  ```javascript
  speechSynthesis.getVoices().filter((v) => v.lang.includes("vi"));
  ```
- Thử với Google Chrome (có built-in Vietnamese voices)

## Files cần reload khi thay đổi:

- Thay đổi manifest.json: Reload extension
- Thay đổi content scripts: Reload extension + refresh page
- Thay đổi popup: Chỉ cần đóng/mở lại popup
- Thay đổi steps.json: Refresh page

Nếu vẫn có lỗi, hãy:

1. Mở Chrome DevTools (F12)
2. Check tab Console có lỗi gì
3. Check tab Network xem steps.json có load được không
4. Check tab Extensions có lỗi extension không
