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
        # تأثير ظهور تدريجي
        var tween := create_tween()
        tween.tween_property(self, "modulate:a", 0.0, 0.0).set_duration(0.0)
        modulate.a = 0.0
        tween.tween_property(self, "modulate:a", 1.0, 0.8).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_SINE)
        # خلفية الشعار تتلاشى
        if logo:
                logo.modulate.a = 0.0
                var logo_tween := create_tween()
                logo_tween.tween_interval(0.3)
                logo_tween.tween_property(logo, "modulate:a", 0.8, 1.0).set_ease(Tween.EASE_OUT)
        start_btn.pressed.connect(_on_start_pressed)

func _on_start_pressed() -> void:
        # تأثير عند الضغط
        start_btn.modulate.a = 0.5
        await get_tree().create_timer(0.15).timeout
        start_btn.modulate.a = 1.0
        # الانتقال للعبة
        get_tree().change_scene_to_file("res://scenes/game_root.tscn")
