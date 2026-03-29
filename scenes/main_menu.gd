extends Control
## ═══════════════════════════════════════════════════════════════
## مشهد القائمة الرئيسية — قبضة الجنرال
## ═══════════════════════════════════════════════════════════════

@onready var logo: TextureRect = $VBoxContainer/Logo
@onready var start_btn: Button = $VBoxContainer/StartBtn
@onready var title_label: Label = $VBoxContainer/Title
@onready var subtitle_label: Label = $VBoxContainer/Subtitle
@onready var version_label: Label = $VBoxContainer/Version
@onready var bg_anim: AnimationPlayer = $BgAnim

func _ready() -> void:
        # تحريك الظهور — إنشاء الرسوم المتحركة برمجياً إذا لم تكن موجودة
        if bg_anim and not bg_anim.has_animation("fade_in"):
                var anim = Animation.new()
                var track_idx = anim.add_track(Animation.TYPE_VALUE)
                anim.track_set_path(track_idx, ".:modulate:a")
                anim.track_insert_key(track_idx, 0.0, 0.0)
                anim.track_insert_key(track_idx, 1.5, 1.0)
                anim.length = 1.5
                bg_anim.add_animation("fade_in", anim)
        if bg_anim and bg_anim.has_animation("fade_in"):
                bg_anim.play("fade_in")
        start_btn.pressed.connect(_on_start_pressed)

func _on_start_pressed() -> void:
        # تأثير عند الضغط
        start_btn.modulate.a = 0.5
        await get_tree().create_timer(0.15).timeout
        start_btn.modulate.a = 1.0
        # الانتقال للعبة
        get_tree().change_scene_to_file("res://scenes/game_root.tscn")
