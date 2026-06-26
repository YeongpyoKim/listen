/* 변경된 정보 제보하기 */
(function () {
  const form = document.getElementById("reportForm");
  const msgEl = document.getElementById("reportMsg");

  function showMsg(text, isError) {
    msgEl.textContent = text;
    msgEl.className = "report-msg" + (isError ? " err" : "");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validation
    if (!data.store_name || !data.report_type || !data.report_content || !data.password) {
      showMsg("필수 항목을 모두 입력해 주세요.", true);
      return;
    }

    if (data.password.length < 4) {
      showMsg("비밀번호는 4 자 이상이어야 합니다.", true);
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    showMsg("제보하고 있습니다...", false);

    try {
      const response = await fetch((window.LH_API_BASE || "") + "/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: data.store_name.trim(),
          report_type: data.report_type,
          current_info: (data.current_info || "").trim(),
          report_content: data.report_content.trim(),
          reference: (data.reference || "").trim(),
          reporter: (data.reporter || "").trim() || "익명",
          password: data.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "제보에 실패했습니다.");
      }

      showMsg("제보가 완료되었습니다. 확인 후 반영하겠습니다. 감사합니다! 🌿", false);
      form.reset();
    } catch (err) {
      showMsg(err.message || "제보 중 문제가 발생했습니다.", true);
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
