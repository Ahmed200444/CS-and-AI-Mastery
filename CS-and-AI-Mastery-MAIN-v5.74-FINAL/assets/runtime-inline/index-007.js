(function(){
      function updateCourseCountTitle(){
        try {
          var _titleEl = document.getElementById('hub-course-count-title');
          var _dataEl = document.getElementById('csai-inline-catalog-data');
          if (!_titleEl || !_dataEl) return;
          var _payload = JSON.parse(_dataEl.textContent || '{}');
          var _courses = Array.isArray(_payload.courses) ? _payload.courses : [];
          if (_courses.length) _titleEl.textContent = 'Explore all ' + _courses.length + ' courses';
        } catch(e) { /* leave the static fallback text in place if this fails */ }
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateCourseCountTitle);
      } else {
        updateCourseCountTitle();
      }
    })();