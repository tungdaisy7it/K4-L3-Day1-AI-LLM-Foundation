# K4 — Ngày 1: Bài Tập & Phản Ánh
## Khám Phá LLM API | Phiếu Thực Hành

**Thời lượng:** 4 tiếng
**Cách làm:** Trả lời từng câu ngay sau khi hoàn thành block tương ứng —
đừng để dồn hết về cuối buổi. Thay dòng `*Câu trả lời của bạn*` bằng câu
trả lời thật (chấm tự động sẽ đếm số câu đã trả lời).

---

## Block 1 — API Cơ Bản (trả lời sau Checkpoint 1)

### Câu 1.1 — Độ nhạy của temperature
Gọi `call_openai` với temperature 0.0, 0.5, 1.0 và 1.5 dùng prompt
**"Hãy kể cho tôi một sự thật thú vị về Việt Nam."**

**Bạn nhận thấy quy luật gì qua bốn phản hồi?** (2–3 câu)
> Đã gọi thật qua model `google/gemini-2.5-flash` (OpenRouter). Ở temperature=0.0 và 0.5,
> model liên tục chọn cùng một sự thật ("Việt Nam là nước xuất khẩu hạt điều lớn nhất thế
> giới") với cách diễn đạt gần như lặp lại — cho thấy độ ổn định cao, ít sáng tạo. Ở
> temperature=1.0, model bất ngờ chuyển sang một chủ đề khác hẳn (xe máy bình quân đầu
> người), thể hiện việc lấy mẫu đã "khám phá" một nhánh xác suất khác. Ở 1.5, model quay
> lại chủ đề hạt điều nhưng cách hành văn phóng khoáng và ít công thức hơn hẳn hai lần đầu.
> Quy luật chung: temperature càng cao, xác suất model chọn token "an toàn nhất" càng giảm,
> nên nội dung và cách diễn đạt càng đa dạng/khó đoán trước, nhưng vẫn giữ được mạch lạc ở
> mức thử nghiệm này (chưa quan sát thấy hiện tượng lạc đề/vô nghĩa dù ở 1.5).

### Câu 1.2 — Chọn temperature cho sản phẩm
**Bạn sẽ đặt temperature bao nhiêu cho chatbot hỗ trợ khách hàng, và tại sao?**
> Khoảng 0.0–0.3. Chatbot hỗ trợ khách hàng cần trả lời nhất quán, đúng chính sách công ty
> và không được "sáng tạo" thêm thông tin (rủi ro bịa chính sách, giá, cam kết bảo hành...).
> Nhiệt độ thấp giúp giảm phương sai giữa các lần trả lời cho cùng một câu hỏi — quan trọng
> khi nhiều khách hàng hỏi cùng một vấn đề và kỳ vọng nhận được câu trả lời giống nhau, đồng
> thời dễ kiểm thử/QA hơn vì hành vi model có thể dự đoán được.

### Câu 1.3 — Đánh đổi chi phí
Kịch bản: 10.000 người dùng hoạt động mỗi ngày, mỗi người gọi API 3 lần,
mỗi lần trung bình ~350 token đầu ra.

**Ước tính GPT-4o đắt hơn GPT-4o-mini bao nhiêu lần cho workload này? Nêu một
trường hợp GPT-4o xứng đáng với chi phí và một trường hợp nên dùng mini:**
> Đã tính bằng `PRICING_PER_1K_TOKENS` trong `template.py`: 10.000 người dùng × 3 lượt/ngày
> = 30.000 lượt gọi/ngày, mỗi lượt ~350 token output → 10.500.000 token output/ngày. Chi phí
> output riêng: GPT-4o ≈ 10.500.000/1000 × $0.010 = **$105.00/ngày**, GPT-4o-mini ≈
> 10.500.000/1000 × $0.0006 = **$6.30/ngày** → GPT-4o đắt hơn mini đúng **16.7 lần** (tỷ lệ
> này cố định vì chỉ phụ thuộc đơn giá, không phụ thuộc số token thực tế). GPT-4o xứng đáng
> khi tác vụ đòi hỏi suy luận phức tạp, độ chính xác cao và rủi ro sai sót tốn kém (ví dụ: tư
> vấn hợp đồng, debug code phức tạp). Mini phù hợp cho tác vụ khối lượng lớn, đơn giản, lặp
> lại như trả lời FAQ, phân loại/gắn nhãn tin nhắn, tóm tắt ngắn — nơi chênh lệch chất lượng
> không đáng để trả thêm 16.7 lần chi phí.

---

## Block 2 — System Prompt & Token (trả lời sau Checkpoint 2)

### Câu 2.1 — Sức mạnh của persona
Gọi `chat_with_system_prompt` hai lần với cùng câu hỏi
**"Giải thích blockchain là gì?"** nhưng hai system prompt khác nhau:
- "Bạn là giáo viên tiểu học, giải thích thật đơn giản cho trẻ 8 tuổi."
- "Bạn là chuyên gia tài chính, trả lời chuyên sâu bằng thuật ngữ kỹ thuật."

**Hai phản hồi khác nhau như thế nào (độ dài, từ vựng, ví dụ)? System prompt
ảnh hưởng đến hành vi model ra sao?** (3–4 câu)
> Đã gọi thật qua `chat_with_system_prompt`. Với persona "giáo viên tiểu học", model mở đầu
> bằng "Chào các bé!", dùng phép ẩn dụ đời thường (so sánh blockchain với "cuốn sổ nhật ký",
> mỗi trang là một "khối"), câu ngắn, không thuật ngữ kỹ thuật, có bullet minh họa bằng ví dụ
> mượn bi giữa hai bạn nhỏ. Với persona "chuyên gia tài chính", model dùng ngay thuật ngữ
> chuyên ngành ("sổ cái phân tán - Distributed Ledger Technology", "liên kết bằng mật mã -
> cryptographically linked"), cấu trúc có tiêu đề in đậm và phân mục kỹ thuật, giọng văn
> trang trọng, không dùng ví dụ đời thường. Điều này cho thấy system prompt không chỉ đổi
> văn phong mà còn đổi cả mức độ trừu tượng, từ vựng và cấu trúc trình bày của model, dù
> user prompt (câu hỏi) hoàn toàn giống nhau.

### Câu 2.2 — tiktoken vs đếm từ
Chọn một đoạn văn tiếng Việt ~100 từ. So sánh số token theo `count_tokens`
(tiktoken) với ước lượng `số từ / 0.75` mà Part 1 đã dùng.

**Hai con số chênh nhau bao nhiêu phần trăm? Vì sao tiếng Việt thường tốn
nhiều token hơn tiếng Anh cùng độ dài?**
> Đoạn văn thử nghiệm dài 151 từ. Ước lượng thô (số từ / 0.75) ra 201.3 token. Đếm thật bằng
> tiktoken với bộ mã hoá của GPT-4o (`o200k_base`) ra 172 token — **thấp hơn ước lượng thô
> khoảng 14.6%**. Thú vị là khi thử lại với bộ mã hoá cũ hơn (`cl100k_base`, dùng cho
> GPT-3.5/GPT-4 đời đầu), cùng đoạn văn đó lại tốn tới 319 token — **cao hơn ước lượng thô
> tới 58.4%**, đúng như quy luật thường được nhắc đến. Lý do: tiếng Việt có dấu thanh là các
> ký tự Unicode nhiều byte (UTF-8); các bộ mã hoá BPE đời cũ được huấn luyện chủ yếu trên
> tiếng Anh nên không có đủ token "sẵn có" cho các cụm ký tự có dấu, buộc phải tách nhỏ thành
> nhiều byte-token. Bộ mã hoá mới hơn của GPT-4o có từ điển lớn hơn nhiều và được huấn luyện
> với dữ liệu đa ngôn ngữ tốt hơn, nên nén tiếng Việt hiệu quả hơn hẳn — cho thấy "tiếng Việt
> tốn token hơn" là đặc điểm của tokenizer cụ thể, không phải quy luật tuyệt đối của ngôn ngữ.

---

## Block 3 — Streaming & Độ Bền (trả lời sau Checkpoint 3)

### Câu 3.1 — Trải nghiệm người dùng với streaming
**Streaming quan trọng nhất trong trường hợp nào, và khi nào thì
non-streaming lại phù hợp hơn?** (1 đoạn văn)
> Streaming quan trọng nhất trong giao diện hội thoại trực tiếp với người dùng (chatbot,
> trợ lý ảo) khi câu trả lời dài — người dùng thấy nội dung xuất hiện gần như ngay lập tức
> thay vì nhìn màn hình trống chờ vài giây, giúp cảm giác "phản hồi nhanh" dù tổng thời gian
> xử lý của model không đổi. Ngược lại, non-streaming phù hợp hơn khi ứng dụng cần xử lý
> toàn bộ phản hồi trước khi dùng — ví dụ parse JSON có cấu trúc, gọi API theo lô ở backend,
> hoặc khi cần kiểm duyệt/hậu xử lý nội dung trước khi hiển thị cho người dùng; trong các
> trường hợp đó hiển thị từng phần dở dang không có ý nghĩa và streaming chỉ làm code phức
> tạp thêm mà không mang lại lợi ích trải nghiệm.

### Câu 3.2 — Vì sao backoff theo cấp số nhân?
**So với delay cố định (ví dụ luôn chờ 1 giây), exponential backoff có lợi
thế gì khi API bị quá tải? Điều gì xảy ra nếu hàng nghìn client cùng retry
với delay cố định giống nhau?**
> Exponential backoff giãn cách thời gian chờ ngày càng xa ra sau mỗi lần thất bại
> (0.1s → 0.2s → 0.4s...), nên nếu server đang quá tải, tổng tải request giảm dần theo thời
> gian thay vì giữ nguyên — cho server cơ hội hồi phục trước khi bị dội thêm request. Với
> delay cố định, nếu hàng nghìn client cùng gặp lỗi ở cùng một thời điểm (ví dụ server vừa
> restart), tất cả sẽ đồng loạt retry sau đúng 1 giây, tạo ra một đợt sóng request đồng bộ
> ("thundering herd") có thể lớn hơn cả lần request ban đầu, khiến server tiếp tục quá tải
> và toàn bộ client lại cùng thất bại, cùng retry — lặp lại vòng lặp sập hệ thống. Backoff
> theo cấp số nhân (thường kết hợp thêm "jitter" ngẫu nhiên) giúp trải đều các lần retry
> theo thời gian, giảm nguy cơ đồng bộ hoá này.

---

## Block 4 — Mini-Project (trả lời sau Checkpoint 4)

### Câu 4.1 — Thiết kế persona
**Bạn chọn persona gì cho trợ lý của mình? Viết lại system prompt đó và giải
thích 1–2 lựa chọn từ ngữ quan trọng trong prompt (ví dụ: vì sao yêu cầu
"trả lời ngắn gọn", vì sao chỉ định ngôn ngữ...):**
> System prompt: *"Bạn là trợ giảng thân thiện của khóa AI, trả lời ngắn gọn bằng tiếng
> Việt, ưu tiên ví dụ thực tế dễ hình dung, và nói rõ khi không chắc chắn thay vì bịa thông
> tin."* — Yêu cầu "trả lời ngắn gọn" quan trọng vì lịch sử hội thoại trong lab chỉ giữ 3 lượt
> gần nhất; phản hồi dài sẽ chiếm nhiều token của mỗi lượt, khiến chi phí và độ trễ tăng
> nhanh mà không thêm nhiều giá trị cho một trợ lý học tập. Chỉ định "bằng tiếng Việt" đảm
> bảo tính nhất quán ngôn ngữ cho toàn bộ phiên chat, tránh model tự chuyển sang tiếng Anh
> giữa chừng khi câu hỏi có lẫn thuật ngữ kỹ thuật. Câu "nói rõ khi không chắc chắn" là một
> rào chắn chống hallucination cơ bản — nhắc model ưu tiên trung thực hơn là cố trả lời cho
> có.

### Câu 4.2 — Hạn chế & cải thiện
**Trợ lý của bạn hiện có hạn chế lớn nhất là gì (ví dụ: history chỉ 3 lượt,
không có bộ nhớ dài hạn, không kiểm duyệt nội dung...)? Đề xuất một cải
thiện cụ thể và mô tả ngắn cách triển khai:**
> Hạn chế lớn nhất là history chỉ giữ 3 lượt gần nhất (`history[-6:]`) — nếu người dùng nhắc
> lại thông tin đã nói ở lượt 1 hoặc 2 trước đó (ví dụ tên, ngữ cảnh câu hỏi ban đầu) sau khi
> đã qua lượt thứ 4, trợ lý sẽ hoàn toàn "quên" vì message đó đã bị cắt khỏi history. Cải
> thiện cụ thể: thêm một bước tóm tắt (summarization) — mỗi khi history sắp bị cắt bớt, gọi
> model tóm tắt các message sẽ bị loại bỏ thành 1–2 câu, lưu vào một biến `long_term_summary`
> và luôn chèn biến này vào ngay sau system prompt ở mỗi lượt gọi tiếp theo. Cách này giữ
> được ngữ cảnh quan trọng của toàn phiên mà không làm số token mỗi lượt tăng vô hạn như khi
> giữ nguyên toàn bộ lịch sử.

---

## Danh Sách Kiểm Tra Nộp Bài

- [ ] `python grade.py` — xem điểm tự động, mục tiêu ≥ 75/100
- [ ] Cả 4 checkpoint pytest đều pass
- [ ] Tất cả 9 câu trong file này đã được trả lời
- [ ] Đã copy bài làm vào folder `solution/`, push lên fork và dán link trên trang bài Lab ở VLearn trước 23:59 ngày 11/09/2026
