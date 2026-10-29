# صداهای «نبرد مدادی» با AvalAI

این اسکریپت جمله‌های صوتی بازی را با AvalAI (تبدیل متن به گفتار) می‌سازد و داخل خود فایل بازی می‌گذارد. بعد از آن بازی بدون نیاز به کلید صداها را پخش می‌کند.

## اجرا (Node 18 یا بالاتر)

```bash
cd pencil-battle
AVALAI_API_KEY=sk-... node make-voices.js
```

خروجی:
- `voices/*.mp3`: هر جمله یک فایل
- `game-with-voices.html`: بازی با صداهای داخلش

تنظیم‌های اختیاری: `AVALAI_VOICE` (پیش‌فرض `onyx`)، `AVALAI_MODEL` (پیش‌فرض `gpt-4o-mini-tts`)، `AVALAI_BASE`.

جمله‌ها مستقیم از `VLINES` در `game.html` خوانده می‌شوند. برای تغییر جمله‌ها همان‌جا را عوض کنید.
