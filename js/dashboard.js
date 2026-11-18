let currentUser = null;
let currentRole = "scholar";
let currentScholar = null;
let staffRows = [];
let editingSubmissionId = null;

document.addEventListener("DOMContentLoaded", async function () {
  safeOn("logout-btn", "click", logout);
  safeOn("submission-form", "submit", submitAcademicSummary);
  safeOn("cancel-edit", "click", cancelCorrection);
  safeOn("register-scholar-form", "submit", registerScholar);
  safeOn("refresh-audit", "click", loadAuditHistory);
  safeOn("refresh-scholar", "click", loadScholarSubmissions);
  safeOn("refresh-staff", "click", loadStaffDashboard);
  safeOn("search-scholars", "input", renderStaffRows);
  safeOn("filter-compliance", "change", renderStaffRows);
  safeOn("filter-program", "change", renderStaffRows);
  safeOn("staff-academic-year", "change", loadStaffDashboard);
  safeOn("staff-semester", "change", loadStaffDashboard);

  try {
    if (!window.supabase) throw new Error("Supabase library failed to load.");
    if (typeof SUPABASE_URL === "undefined" || !SUPABASE_URL) throw new Error("Configure js/supabase.js first.");
    if (typeof supabaseClient === "undefined") throw new Error("Supabase client is missing.");

    const sessionResult = await supabaseClient.auth.getSession();
    if (sessionResult.error) throw sessionResult.error;
    if (!sessionResult.data.session) { location.href = "index.html"; return; }

    currentUser = sessionResult.data.session.user;
    byId("user-label").textContent = currentUser.email || currentUser.id;

    const pr = await supabaseClient.from("profiles").select("full_name,role").eq("id", currentUser.id).maybeSingle();
    if (pr.error) throw new Error("Profile query failed: " + pr.error.message);
    if (!pr.data) {
      byId("role-chip").textContent = "No profile";
      byId("welcome-title").textContent = "Profile missing";
      showMessage("No profile is linked to this login. Ask the Scholarship Staff to check the Supabase profiles table.");
      return;
    }

    currentRole = String(pr.data.role || "scholar").toLowerCase().trim();
    byId("user-label").textContent = pr.data.full_name || currentUser.email;
    byId("role-chip").textContent = currentRole === "admin" ? "Administrator" : currentRole === "staff" ? "Scholarship Staff" : "Scholar";

    if (currentRole === "staff" || currentRole === "admin") {
      byId("welcome-title").textContent = "Staff dashboard";
      byId("role-description").textContent = "Verify submissions, evaluate compliance, and record renewal decisions.";
      byId("staff-panel").classList.remove("hidden");
      await loadStaffDashboard();
      await loadAuditHistory();
    } else if (currentRole === "scholar") {
      byId("welcome-title").textContent = "My scholarship";
      byId("role-description").textContent = "Submit academic records and track your compliance status.";
      byId("scholar-panel").classList.remove("hidden");
      byId("scholar-records-panel").classList.remove("hidden");
      const sr = await supabaseClient.from("scholars")
        .select("id,user_id,student_id,full_name,degree_program,scholarship_programs(program_name)")
        .eq("user_id", currentUser.id).maybeSingle();
      if (sr.error) throw new Error("Scholar link query failed: " + sr.error.message);
      currentScholar = sr.data;
      if (!currentScholar) {
        byId("scholar-panel").classList.add("hidden");
        showMessage("Your login is not linked to a scholar record yet. Contact Scholarship Staff.");
      } else {
        byId("welcome-title").textContent = "Welcome, " + currentScholar.full_name;
        await loadScholarSubmissions();
      }
    } else {
      throw new Error("Your account has an unsupported role. Contact Scholarship Staff.");
    }
  } catch (e) {
    console.error("Dashboard initialization failed", e);
    byId("role-chip").textContent = "Error";
    byId("welcome-title").textContent = "Could not load";
    byId("role-description").textContent = e.message || "Unknown error";
    showMessage(e.message || "Could not load dashboard.");
  }
});

function byId(id) { return document.getElementById(id); }
function safeOn(id, event, handler) { const el = byId(id); if (el) el.addEventListener(event, handler); }
function showMessage(message, success) {
  const el = byId("page-message");
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("success", !!success);
}
function rpcError(err) { return err ? (err.message || err.hint || err.details || String(err)) : "Action failed."; }
async function logout() {
  const result = await supabaseClient.auth.signOut();
  if (result.error) { showMessage(result.error.message); return; }
  location.href = "index.html";
}
function numberValue(id, integer) {
  const raw = byId(id).value.trim();
  if (raw === "") throw new Error("Complete all required numeric fields.");
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error("Enter a valid number.");
  if (integer && !Number.isInteger(value)) throw new Error("Units and subject counts must be whole numbers.");
  if (value < 0) throw new Error("Units and subject counts cannot be negative.");
  if (id === "gwa" && (value < 1 || value > 5)) throw new Error("GWA must be between 1.00 and 5.00.");
  return value;
}
function formatManila(iso) {
  try { return new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila" }); }
  catch (_) { return String(iso || ""); }
}
function friendlyAction(action) {
  const map = {
    SUBMIT_ACADEMIC_SUMMARY: "Submitted academic summary",
    RESUBMIT_CORRECTED_ACADEMIC_SUMMARY: "Resubmitted corrected summary",
    VERIFY_SUBMISSION: "Verified evidence",
    RETURN_SUBMISSION: "Returned for correction",
    EVALUATE_COMPLIANCE: "Evaluated compliance",
    RENEWAL_APPROVED: "Approved renewal",
    RENEWAL_HELD: "Held renewal",
    REGISTER_SCHOLAR: "Registered scholar"
  };
  return map[action] || String(action || "").replace(/_/g, " ");
}
function formatDetails(details) {
  if (!details) return "-";
  if (typeof details === "string") { try { details = JSON.parse(details); } catch (_) { return esc(details); } }
  if (typeof details !== "object") return esc(String(details));
  const parts = [];
  if (details.decision) parts.push("Decision: " + details.decision);
  if (details.status) parts.push("Status: " + details.status);
  if (details.reason) parts.push("Reason: " + details.reason);
  if (Array.isArray(details.reasons) && details.reasons.length) parts.push("Reasons: " + details.reasons.join("; "));
  if (details.student_id) parts.push("Student: " + details.student_id);
  if (details.policy) parts.push("Policy: " + details.policy);
  if (details.academic_year) parts.push(details.academic_year + (details.semester ? " Sem " + details.semester : ""));
  return esc(parts.length ? parts.join(" | ") : JSON.stringify(details));
}

async function submitAcademicSummary(event) {
  event.preventDefault();
  showMessage("");
  if (!currentScholar) { showMessage("Your login is not linked to a scholar record."); return; }
  const form = event.currentTarget;
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const academicYear = byId("academic-year").value;
    const semester = Number(byId("semester").value);
    const values = {
      gwa: numberValue("gwa", false),
      units_enrolled: numberValue("units", true),
      failed_subjects: numberValue("failed", true),
      incomplete_subjects: numberValue("incompletes", true),
      dropped_subjects: numberValue("dropped", true),
      evidence_reference: byId("evidence").value.trim()
    };
    if (!values.evidence_reference) throw new Error("Enter the evidence document reference.");
    let result;
    if (editingSubmissionId) {
      result = await supabaseClient.from("grade_submissions").update(values).eq("id", editingSubmissionId);
    } else {
      result = await supabaseClient.from("grade_submissions").insert({
        scholar_id: currentScholar.id,
        academic_year: academicYear,
        semester: semester,
        ...values
      });
    }
    if (result.error) {
      if (result.error.code === "23505") throw new Error("A submission already exists for this academic year and semester.");
      throw result.error;
    }
    editingSubmissionId = null;
    byId("submission-heading").textContent = "Submit academic summary";
    byId("cancel-edit").classList.add("hidden");
    form.reset();
    byId("failed").value = "0";
    byId("incompletes").value = "0";
    byId("dropped").value = "0";
    showMessage("Academic summary saved. It is pending staff verification.", true);
    await loadScholarSubmissions();
  } catch (e) {
    console.error("Submission failed", e);
    showMessage(rpcError(e));
  } finally {
    button.disabled = false;
  }
}

async function loadScholarSubmissions() {
  if (!currentScholar) return;
  const box = byId("scholar-records");
  if (!box) return;
  box.innerHTML = "<p class='muted'>Loading submissions...</p>";
  const result = await supabaseClient.from("grade_submissions")
    .select("id,academic_year,semester,gwa,units_enrolled,submission_status,verification_reason,compliance_status,deficiency_reasons,submitted_at,renewal_decisions(decision,reason)")
    .eq("scholar_id", currentScholar.id).order("submitted_at", { ascending: false });
  if (result.error) { box.textContent = result.error.message; return; }
  if (!result.data || !result.data.length) { box.innerHTML = "<p class='muted'>No submissions yet.</p>"; return; }

  let html = "<table><thead><tr><th>Term</th><th>GWA</th><th>Verification</th><th>Compliance</th><th>Renewal</th><th>Submitted</th></tr></thead><tbody>";
  result.data.forEach(function (row) {
    const reasons = Array.isArray(row.deficiency_reasons) ? row.deficiency_reasons.join("; ") : "";
    const renewal = row.renewal_decisions && row.renewal_decisions[0] ? row.renewal_decisions[0].decision : "Not decided";
    const correction = row.submission_status === "Returned"
      ? "<button class='secondary' type='button' data-correct='" + esc(row.id) + "'>Correct and resubmit</button>" : "";
    html += "<tr><td>" + esc(row.academic_year) + " · Sem " + esc(row.semester) +
      "</td><td>" + Number(row.gwa).toFixed(2) +
      "</td><td>" + badge(row.submission_status) + (row.verification_reason ? "<div class='reason'>" + esc(row.verification_reason) + "</div>" : "") +
      "</td><td>" + badge(row.compliance_status) + "<div class='reason'>" + esc(reasons) + "</div>" +
      "</td><td>" + badge(renewal) +
      "</td><td>" + esc(formatManila(row.submitted_at)) + "<div>" + correction + "</div></td></tr>";
  });
  box.innerHTML = html + "</tbody></table>";
  box.querySelectorAll("button[data-correct]").forEach(function (button) {
    button.addEventListener("click", function () { beginCorrection(button.dataset.correct); });
  });
}

async function beginCorrection(id) {
  const result = await supabaseClient.from("grade_submissions")
    .select("id,academic_year,semester,gwa,units_enrolled,failed_subjects,incomplete_subjects,dropped_subjects,evidence_reference")
    .eq("id", id).eq("submission_status", "Returned").maybeSingle();
  if (result.error || !result.data) {
    showMessage(result.error ? rpcError(result.error) : "Submission not found or it is no longer returned.");
    return;
  }
  const row = result.data;
  editingSubmissionId = id;
  byId("academic-year").value = row.academic_year;
  byId("semester").value = String(row.semester);
  byId("gwa").value = row.gwa;
  byId("units").value = row.units_enrolled;
  byId("failed").value = row.failed_subjects;
  byId("incompletes").value = row.incomplete_subjects;
  byId("dropped").value = row.dropped_subjects;
  byId("evidence").value = row.evidence_reference;
  byId("academic-year").disabled = true;
  byId("semester").disabled = true;
  byId("submission-heading").textContent = "Correct returned submission";
  byId("cancel-edit").classList.remove("hidden");
  byId("submission-form").scrollIntoView({ behavior: "smooth", block: "start" });
  showMessage("Correct the returned fields, then resubmit. The original submission timestamp is preserved.");
}
function cancelCorrection() {
  editingSubmissionId = null;
  byId("submission-form").reset();
  byId("academic-year").disabled = false;
  byId("semester").disabled = false;
  byId("submission-heading").textContent = "Submit academic summary";
  byId("cancel-edit").classList.add("hidden");
  byId("failed").value = "0";
  byId("incompletes").value = "0";
  byId("dropped").value = "0";
}

async function registerScholar(event) {
  event.preventDefault();
  showMessage("");
  const form = event.currentTarget;
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const studentId = byId("reg-student-id").value.trim();
    const fullName = byId("reg-full-name").value.trim();
    const degreeProgram = byId("reg-program").value.trim();
    const authUid = byId("reg-user-id").value.trim();
    if (!studentId || !fullName || !degreeProgram) throw new Error("Complete all required scholar details.");
    if (authUid && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(authUid)) {
      throw new Error("Enter a valid Supabase Auth User UID (UUID).");
    }
    const policy = await supabaseClient.from("scholarship_programs")
      .select("id").eq("program_name", byId("reg-policy").value).eq("active", true).maybeSingle();
    if (policy.error) throw policy.error;
    if (!policy.data) throw new Error("The selected scholarship policy is not available. Run the Supabase setup SQL first.");
    const payload = {
      student_id: studentId,
      full_name: fullName,
      degree_program: degreeProgram,
      scholarship_id: policy.data.id,
      created_by: currentUser.id
    };
    if (authUid) payload.user_id = authUid;
    const result = await supabaseClient.from("scholars").insert(payload);
    if (result.error) {
      if (result.error.code === "23505") throw new Error("That Student ID or Auth User UID is already linked to another scholar.");
      if (result.error.code === "23503") throw new Error("That Auth User UID does not exist. Create the login in Supabase Authentication first.");
      throw result.error;
    }
    form.reset();
    showMessage(authUid ? "Scholar registered and login linked." : "Scholar record registered. Create the Auth login and link it later.", true);
    await loadStaffDashboard();
    await loadAuditHistory();
  } catch (e) {
    console.error("Scholar registration failed", e);
    showMessage(rpcError(e));
  } finally {
    button.disabled = false;
  }
}

async function loadAuditHistory() {
  const box = byId("audit-records");
  if (!box) return;
  box.innerHTML = "<p class='muted'>Loading audit history...</p>";
  const result = await supabaseClient.from("audit_logs")
    .select("id,actor_id,action,entity_type,entity_id,details,created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (result.error) { box.textContent = result.error.message; return; }
  if (!result.data || !result.data.length) { box.innerHTML = "<p class='muted'>No audit events yet.</p>"; return; }
  const actorIds = [...new Set(result.data.map(row => row.actor_id).filter(Boolean))];
  const nameMap = {};
  if (actorIds.length) {
    const names = await supabaseClient.from("profiles").select("id,full_name").in("id", actorIds);
    if (names.error) console.warn("Could not load audit actor names", names.error);
    if (names.data) names.data.forEach(p => { nameMap[p.id] = p.full_name; });
  }
  let html = "<table><thead><tr><th>Time (Manila)</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>";
  result.data.forEach(function (row) {
    const actorName = nameMap[row.actor_id] || (row.actor_id ? String(row.actor_id).slice(0, 8) + "..." : "System");
    html += "<tr><td>" + esc(formatManila(row.created_at)) + "</td><td>" + esc(actorName) +
      "</td><td>" + esc(friendlyAction(row.action)) + "</td><td>" + esc(row.entity_type) +
      "</td><td>" + formatDetails(row.details) + "</td></tr>";
  });
  box.innerHTML = html + "</tbody></table>";
}

async function loadStaffDashboard() {
  const box = byId("staff-records");
  if (!box) return;
  box.innerHTML = "<p class='muted'>Loading records...</p>";
  const academicYear = byId("staff-academic-year").value;
  const semester = Number(byId("staff-semester").value);
  byId("term-heading").textContent = "ACADEMIC YEAR " + academicYear.replace("-", "–") + " · " + (semester === 3 ? "SUMMER" : "SEMESTER " + semester);

  const scholarsResult = await supabaseClient.from("scholars")
    .select("id,student_id,full_name,degree_program,user_id,scholarship_programs(program_name)");
  if (scholarsResult.error) { box.textContent = scholarsResult.error.message; showMessage("Scholars query: " + scholarsResult.error.message); return; }
  const submissionsResult = await supabaseClient.from("grade_submissions")
    .select("id,scholar_id,academic_year,semester,gwa,units_enrolled,failed_subjects,incomplete_subjects,dropped_subjects,evidence_reference,submitted_at,submission_status,verification_reason,compliance_status,deficiency_reasons,renewal_decisions(decision,reason)")
    .eq("academic_year", academicYear).eq("semester", semester)
    .order("submitted_at", { ascending: false });
  if (submissionsResult.error) { box.textContent = submissionsResult.error.message; showMessage("Submissions query: " + submissionsResult.error.message); return; }

  const scholars = scholarsResult.data || [];
  staffRows = (submissionsResult.data || []).map(function (submission) {
    submission.scholar = scholars.find(function (scholar) { return scholar.id === submission.scholar_id; }) || null;
    return submission;
  });
  byId("metric-assigned").textContent = scholars.length;
  byId("metric-pending").textContent = staffRows.filter(row => row.submission_status === "Pending").length;
  byId("metric-compliant").textContent = staffRows.filter(row => row.compliance_status === "Compliant").length;
  byId("metric-deficiency").textContent = staffRows.filter(row => row.compliance_status === "With Deficiency").length;

  const programSelect = byId("filter-program");
  const programs = [...new Set(scholars.map(s => s.scholarship_programs && s.scholarship_programs.program_name).filter(Boolean))];
  const currentProgram = programSelect.value;
  programSelect.innerHTML = "<option value=''>All programs</option>" + programs.map(p => "<option value='" + esc(p) + "'>" + esc(p) + "</option>").join("");
  if (programs.includes(currentProgram)) programSelect.value = currentProgram;
  renderStaffRows();
}

function renderStaffRows() {
  const box = byId("staff-records");
  if (!box) return;
  const term = (byId("search-scholars").value || "").toLowerCase().trim();
  const compliance = byId("filter-compliance").value;
  const program = byId("filter-program").value;
  const rows = staffRows.filter(function (row) {
    const scholar = row.scholar || {};
    const nameMatch = ((scholar.student_id || "") + " " + (scholar.full_name || "")).toLowerCase().includes(term);
    const complianceMatch = !compliance || row.compliance_status === compliance;
    const programMatch = !program || (scholar.scholarship_programs && scholar.scholarship_programs.program_name === program);
    return nameMatch && complianceMatch && programMatch;
  });
  if (!rows.length) { box.innerHTML = "<p class='muted'>No submissions found for this term and filter.</p>"; return; }
  let html = "<table><thead><tr><th>Scholar</th><th>Policy</th><th>Academic summary</th><th>Verification</th><th>Compliance</th><th>Renewal</th><th>Actions</th></tr></thead><tbody>";
  rows.forEach(function (row) {
    const scholar = row.scholar || {};
    const policy = scholar.scholarship_programs ? scholar.scholarship_programs.program_name : "-";
    const reasons = Array.isArray(row.deficiency_reasons) ? row.deficiency_reasons.join("; ") : "";
    const renewal = row.renewal_decisions && row.renewal_decisions[0] ? row.renewal_decisions[0].decision : "Not decided";
    let actions = "";
    if (row.submission_status === "Pending") {
      actions += "<button class='primary' type='button' data-action='verify' data-id='" + esc(row.id) + "'>Verify</button> ";
      actions += "<button class='secondary' type='button' data-action='return' data-id='" + esc(row.id) + "'>Return</button>";
    }
    if (row.submission_status === "Verified" && row.compliance_status === "Pending") {
      actions += "<button class='secondary' type='button' data-action='evaluate' data-id='" + esc(row.id) + "'>Evaluate</button>";
    }
    if (row.submission_status === "Verified" && row.compliance_status === "Compliant") {
      actions += "<button class='primary' type='button' data-action='approve' data-id='" + esc(row.id) + "'>Approve renewal</button> ";
      actions += "<button class='secondary' type='button' data-action='hold' data-id='" + esc(row.id) + "'>Hold</button>";
    }
    if (row.submission_status === "Verified" && row.compliance_status === "With Deficiency") {
      actions += "<button class='secondary' type='button' data-action='hold' data-id='" + esc(row.id) + "'>Hold</button>";
    }
    if (!actions) actions = "-";
    html += "<tr><td><strong>" + esc(scholar.full_name || "Unknown") + "</strong><div class='reason'>" +
      esc(scholar.student_id || "") + " · " + esc(scholar.degree_program || "") +
      "</div></td><td>" + esc(policy) +
      "</td><td>GWA " + Number(row.gwa).toFixed(2) +
      "<div class='reason'>" + row.units_enrolled + " units · Failed " + row.failed_subjects +
      " · INC " + row.incomplete_subjects + " · Dropped " + row.dropped_subjects +
      "</div><div class='reason'>" + esc(row.evidence_reference) +
      "</div><div class='reason'>Submitted: " + esc(formatManila(row.submitted_at)) +
      "</div></td><td>" + badge(row.submission_status) +
      (row.verification_reason ? "<div class='reason'>" + esc(row.verification_reason) + "</div>" : "") +
      "</td><td>" + badge(row.compliance_status) + "<div class='reason'>" + esc(reasons) +
      "</div></td><td>" + badge(renewal) +
      "</td><td class='actions'>" + actions + "</td></tr>";
  });
  box.innerHTML = html + "</tbody></table>";
  box.querySelectorAll("button[data-action]").forEach(function (button) {
    button.addEventListener("click", function () { handleStaffAction(button.dataset.action, button.dataset.id); });
  });
}

async function handleStaffAction(action, id) {
  showMessage("");
  try {
    if (action === "verify" || action === "return") {
      const reason = action === "return" ? prompt("Enter the reason for returning this submission:") : null;
      if (action === "return" && (!reason || !reason.trim())) { showMessage("A reason is required to return a submission."); return; }
      const result = await supabaseClient.rpc("staff_verify_submission", {
        p_submission_id: id,
        p_decision: action === "verify" ? "Verified" : "Returned",
        p_reason: reason
      });
      if (result.error) throw result.error;
      showMessage(action === "verify" ? "Evidence verified." : "Submission returned for correction.", true);
    } else if (action === "evaluate") {
      const result = await supabaseClient.rpc("staff_evaluate_submission", { p_submission_id: id });
      if (result.error) throw result.error;
      const data = typeof result.data === "string" ? JSON.parse(result.data) : result.data;
      showMessage("Evaluation completed: " + (data.status || "Completed") + (data.reasons && data.reasons.length ? " — " + data.reasons.join("; ") : ""), true);
    } else if (action === "approve" || action === "hold") {
      const reason = action === "hold" ? prompt("Reason for holding renewal:") : null;
      if (action === "hold" && (!reason || !reason.trim())) { showMessage("A reason is required to hold renewal."); return; }
      if (!confirm(action === "approve" ? "Approve renewal for this Compliant submission?" : "Hold renewal for this scholar?")) return;
      const result = await supabaseClient.rpc("staff_decide_renewal", {
        p_submission_id: id,
        p_decision: action === "approve" ? "Approved" : "Held",
        p_reason: reason
      });
      if (result.error) throw result.error;
      showMessage(action === "approve" ? "Renewal approved." : "Renewal held.", true);
    }
    await loadStaffDashboard();
    await loadAuditHistory();
  } catch (e) {
    console.error("Staff action failed", action, id, e);
    showMessage(rpcError(e));
  }
}
function badge(value) {
  const cls = ["Compliant", "Approved", "Verified"].includes(value) ? "good"
    : ["With Deficiency", "Returned", "Held"].includes(value) ? "bad" : "wait";
  return "<span class='status " + cls + "'>" + esc(value || "Pending") + "</span>";
}
function esc(value) {
  return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
