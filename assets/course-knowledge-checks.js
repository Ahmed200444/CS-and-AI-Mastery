(() => {
  'use strict';

  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const activeSlug = () => window.CSAIMasteryPracticeFolder?.currentTrack?.() || 'course';
  const bestKey = slug => `cs-ai-knowledge-check-best-${slug}`;

  function extractLessons(section) {
    return [...section.querySelectorAll('.fst-lesson')].map((card, index) => {
      const title = card.querySelector('summary span:nth-child(2)')?.textContent?.trim() || `Lesson ${index + 1}`;
      const explanation = card.querySelector('.fst-body p')?.textContent?.trim() || '';
      return { title, explanation };
    }).filter(item => item.explanation.length > 24);
  }

  function sampleIndexes(length, count) {
    const indexes = Array.from({length}, (_, i) => i);
    for (let i = indexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    return indexes.slice(0, Math.min(count, length));
  }

  function buildQuestions(lessons) {
    return sampleIndexes(lessons.length, 5).map(correctIndex => {
      const distractors = sampleIndexes(lessons.length, lessons.length)
        .filter(index => index !== correctIndex)
        .slice(0, 3);
      const choices = [...distractors, correctIndex].sort(() => Math.random() - 0.5);
      return {
        prompt: lessons[correctIndex].explanation,
        correct: correctIndex,
        choices
      };
    });
  }

  function render() {
    const section = document.getElementById('full-study-track');
    if (!section || section.querySelector('#course-knowledge-check')) return;
    const lessons = extractLessons(section);
    if (lessons.length < 4) return;

    const slug = activeSlug();
    const questions = buildQuestions(lessons);
    const best = Number(localStorage.getItem(bestKey(slug)) || 0);
    const box = document.createElement('section');
    box.id = 'course-knowledge-check';
    box.innerHTML = `
      <div class="ck-head">
        <div><div class="fst-kicker">KNOWLEDGE CHECK</div><h3>Match each explanation to the correct topic</h3><p>Five questions are generated from the lessons on this course page.</p></div>
        <div class="ck-best"><strong>${best}/5</strong><span>best score</span></div>
      </div>
      <form class="ck-form">
        ${questions.map((question, qIndex) => `
          <fieldset class="ck-question">
            <legend>${qIndex + 1}. ${esc(question.prompt)}</legend>
            ${question.choices.map(choiceIndex => `
              <label><input type="radio" name="q${qIndex}" value="${choiceIndex}"><span>${esc(lessons[choiceIndex].title)}</span></label>
            `).join('')}
          </fieldset>
        `).join('')}
        <div class="ck-actions"><button type="submit">Check answers</button><button type="button" data-ck-retry>New questions</button><output aria-live="polite"></output></div>
      </form>`;

    section.appendChild(box);
    const form = box.querySelector('.ck-form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      let score = 0;
      questions.forEach((question, index) => {
        const selected = form.querySelector(`input[name="q${index}"]:checked`);
        const fieldset = selected?.closest('fieldset') || form.querySelectorAll('.ck-question')[index];
        fieldset.classList.remove('ck-correct','ck-wrong');
        if (selected && Number(selected.value) === question.correct) {
          score += 1;
          fieldset.classList.add('ck-correct');
        } else {
          fieldset.classList.add('ck-wrong');
        }
      });
      const currentBest = Math.max(best, score, Number(localStorage.getItem(bestKey(slug)) || 0));
      localStorage.setItem(bestKey(slug), String(currentBest));
      box.querySelector('.ck-best strong').textContent = `${currentBest}/5`;
      form.querySelector('output').textContent = score === 5 ? '5/5 — ready to move on.' : `${score}/5 — review the highlighted lessons and try again.`;
    });
    box.querySelector('[data-ck-retry]').addEventListener('click', () => {
      box.remove();
      render();
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    #course-knowledge-check{margin-top:20px;padding:20px;border:1px solid #d7dee7;border-radius:16px;background:#fff}
    .ck-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.ck-head h3{margin:5px 0 6px;font-size:1.35rem}.ck-head p{margin:0}
    .ck-best{min-width:96px;padding:12px;text-align:center;border-radius:12px;background:#162433;color:#fff}.ck-best strong{display:block;font-size:1.35rem}.ck-best span{font-size:.75rem}
    .ck-form{display:grid;gap:12px;margin-top:16px}.ck-question{border:1px solid #d7dee7;border-radius:12px;padding:14px}.ck-question legend{font-weight:700;line-height:1.45;padding:0 6px}.ck-question label{display:flex;gap:9px;align-items:flex-start;margin:9px 0;padding:8px;border-radius:8px;cursor:pointer}.ck-question label:hover{background:#f4f7fa}.ck-correct{border-color:#15803d!important;background:#f0fdf4}.ck-wrong{border-color:#b91c1c!important;background:#fff1f2}
    .ck-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ck-actions button{border:0;border-radius:9px;padding:10px 14px;font-weight:700;cursor:pointer}.ck-actions button[type="submit"]{background:#17649a;color:#fff}.ck-actions button[type="button"]{background:#e5edf4}.ck-actions output{font-weight:700}
    html[data-theme="dark"] #course-knowledge-check,html[data-theme="dark"] .ck-question{background:#17212c!important;color:#edf3f8!important;border-color:#344352!important}html[data-theme="dark"] .ck-question label:hover{background:#21303e!important}html[data-theme="dark"] .ck-correct{background:#14291b!important}html[data-theme="dark"] .ck-wrong{background:#321a1f!important}html[data-theme="dark"] .ck-actions button[type="button"]{background:#2a3948!important;color:#edf3f8!important}
    @media(max-width:640px){.ck-head{display:block}.ck-best{margin-top:12px}.ck-actions{align-items:stretch}.ck-actions button{width:100%}}
  `;
  document.head.appendChild(style);

  const start = () => {
    render();
    new MutationObserver(() => setTimeout(render, 40)).observe(document.body, {childList:true, subtree:true});
    window.addEventListener('hashchange', () => setTimeout(render, 120));
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();