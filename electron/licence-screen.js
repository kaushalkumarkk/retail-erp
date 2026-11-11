const $ = (id) => document.getElementById(id);
async function render() {
  try {
    const s = await window.retailDesktop.licenceStatus();
    $("machine").value = s.machineId || "";
    $("title").textContent =
      s.state === "expired"
        ? "Your annual licence has expired"
        : s.state === "pending"
          ? "Licence not started yet"
          : s.state === "error"
            ? "Licence verification required"
            : "Activate Retail ERP";
    $("message").textContent = s.message;
    $("details").textContent = s.shop
      ? `${s.shop} · ${s.id} · ${s.starts} to ${s.expires} (renewal due)`
      : "No trial or automatic extension. A signed annual key is required.";
  } catch (e) {
    $("error").textContent = e.message;
  }
}
$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("machine").value);
    $("copy").textContent = "Copied";
  } catch {
    $("machine").focus();
    $("machine").select();
  }
});
$("activation").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("error").textContent = "";
  $("activate").disabled = true;
  try {
    const s = await window.retailDesktop.activateLicence($("key").value);
    if (s.state !== "active") {
      $("error").textContent = s.message;
      await render();
    }
  } catch (e) {
    $("error").textContent = e.message;
  } finally {
    $("activate").disabled = false;
  }
});
$("backup").addEventListener("click", async () => {
  try {
    const r = await window.retailDesktop.exportLockedBackup();
    $("error").textContent = r.saved ? "Backup saved." : r.message || "";
  } catch (e) {
    $("error").textContent = e.message;
  }
});
render();
setInterval(render, 15000);
