# 📌 {{name}}

> {{introduce}}

---

## 📂 목차
1. [소개](#소개)
2. [연락처](#연락처)
3. [기술 스택](#기술-스택)
4. [프로젝트](#프로젝트)
5. [학력 및 활동](#학력-및-활동)
6. [자격증 및 어학](#자격증-및-어학)

---

## 🧑‍💼 소개
- **이름:** {{name}}
- **한 줄 소개:** {{introduce}}

---

## 📞 연락처
- **Email:** {{email}}
- **Phone:** {{phoneNumber}}
- **GitHub:** [{{githubUrl}}]({{githubUrl}})
- **LinkedIn:** [{{linkedInUrl}}]({{linkedInUrl}})
- **Blog:** [{{blogUrl}}]({{blogUrl}})

---

## 🛠 기술 스택
{{techList}}

---

## 🚀 프로젝트

{% for p in project %}
### 📌 {{p.title}}
> {{p.category}}
> {{p.content}}

**썸네일:** ![]({{p.thumbnailUrl}})  
**YouTube:** [{{p.youtubeUrl}}]({{p.youtubeUrl}})  
**GitHub:** [{{p.githubUrl}}]({{p.githubUrl}})  
**techList** {{p.techList}}
{% endfor %}
---

## 🎓 학력 및 활동
{% for e in eduAndAct %}
- **{{e.name}}** ({{e.startDate}} ~ {{e.endDate}})  
  {{e.description}}
  {% endfor %}

---

## 🏆 자격증 및 어학
{% for c in certAndLang %}
- **{{c.name}}** — {{c.certificateIssuer}} ({{c.date}})
  {% endfor %}

---