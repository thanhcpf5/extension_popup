
const validateStep = function (step) {
  if (!step.validate) return true;
  const el = document.querySelector(step.validate);
  if (!el) return false;

  // Kiểm tra kiểu input
  if (el.type === "file") {
    return el.files && el.files.length > 0;
  }
  // Mặc định kiểm tra value
  return el.value && el.value.trim() !== "";
};
