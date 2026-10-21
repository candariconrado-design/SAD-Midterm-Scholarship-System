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

  try {
    if (typeof window.supabase === "undefined") {
      throw new Error("Supabase library failed to load. Check your internet connection.");
    }
    if (typeof SUPABASE_URL === "undefined" || !SUPABASE_URL || SUPABASE_URL.indexOf("YOUR-PROJECT") !== -1) {
      throw new Error("Configure Supabase URL in js/supabase.js first.");
    }
    if (typeof supabaseClient === "undefined") {
      throw new Error("supabaseClient missing. Check js/supabase.js.");
    }

    byId("role-description").textContent = "Checking session...";

    const sessionResult = await supabaseClient.auth.getSession();
    if (sessionResult.error) throw sessionResult.error;
    if (!sessionResult.data.session) {
      location.href = "index.html";
      return;
    }

    currentUser = sessionResult.data.session.user;
    byId("user-label").textContent = currentUser.email || currentUser.id;
    byId("role-description").textContent = "Loading profile...";

    const pr = await supabaseClient
      .from("profiles")
      .select("full_name,role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (pr.error) {
      throw new Error("Profile query failed: " + (pr.error.message || JSON.stringify(pr.error)));
    }

    if (!pr.data) {
      byId("role-chip").textContent = "No profile";
      byId("welcome-title").textContent = "Profile missing";
      byId("role-description").textContent = "No row in profiles for this login.";
      showMessage(
        "No profile for " + currentUser.id +
        ". SQL: INSERT INTO profiles (id, full_name, role) VALUES ('" +
        currentUser.id + "', 'Scholarship Staff', 'staff') ON CONFLICT (id) DO UPDATE SET role = 'staff';"
      );
      return;
    }

    currentRole = String(pr.data.role || "scholar").toLowerCase().trim();
    byId("user-label").textContent = pr.data.full_name || currentUser.email;
    byId("role-chip").textContent =
      currentRole === "admin" ? "Administrator" :
      currentRole === "staff" ? "Scholarship Staff" : "Scholar";

    if (currentRole === "staff" || currentRole === "admin") {
      byId("welcome-title").textContent = "Staff dashboard";
      byId("role-description").textContent = "Verify submissions, evaluate compliance, and record renewal decisions.";
      byId("staff-panel").classList.remove("hidden");
      byId("scholar-panel").classList.add("hidden");
      byId("scholar-records-panel").classList.add("hidden");
      await loadStaffDashboard();
      await loadAuditHistory();
    } else {
      byId("welcome-title").textContent = "My scholarship";
      byId("role-description").textContent = "Submit academic records and track your compliance status.";
      byId("staff-panel").classList.add("hidden");
      byId("scholar-panel").classList.remove("hidden");
      byId("scholar-records-panel").classList.remove("hidden");

      const sr = await supabaseClient
        .from("scholars")
        .select("id,student_id,full_name,degree_program,scholarship_programs(program_name)")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (sr.error) throw new Error("Scholar link query failed: " + sr.error.message);
      currentScholar = sr.data;

      if (!currentScholar) {
        byId("scholar-panel").classList.add("hidden");
        showMessage("Your account is not linked to a scholar record yet. Contact Scholarship Staff.");
      }
      await loadScholarSubmissions();
    }
  } catch (e) {
    console.error("Dashboard init error", e);
    byId("role-chip").textContent = "Error";
    byId("welcome-title").textContent = "Could not load";
    byId("role-description").textContent = e.message || "Unknown error";
    showMessage(e.message || "Could not load dashboard. Open F12 Console for details.");
  }
});

function byId(id) { return document.getElementById(id); }

function safeOn(id, event, handler) {
  const el = byId(id);
  if (el) el.addEventListener(event, handler);
}

function showMessage(msg, success) {
  const el = byId("page-message");
  if (!el) return;
  el.textContent = msg || "";
  el.classList.toggle("success", !!success);
}

function rpcError(err) {
  if (!err) return "Action failed.";
  return err.message || err.hint || err.details || String(err);
}

async function logout() {
  await supabaseClient.auth.signOut();
  location.href = "index.html";
}

function numberValue(id, integer) {
  const v = Number(byId(id).value);
  if (!Number.isFinite(v)) throw new Error("Enter a valid number.");
  if (integer && !Number.isInteger(v)) throw new Error("Units and subject counts must be whole numbers.");
  if (v < 0) throw new Error("Units and subject counts cannot be negative.");
  if (id === "gwa" && (v < 1 || v > 5)) throw new Error("GWA must be between 1.00 and 5.00.");
  return v;
}

function formatManila(iso) {
  try { return new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila" }); }
  catch (e) { return String(iso || ""); }
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
  if (typeof details === "string") {
    try { details = JSON.parse(details); } catch (e) { return esc(details); }
  }
  if (typeof details !== "object") return esc(String(details));
  const parts = [];
  if (details.decision) parts.push("Decision: " + details.decision);
  if (details.status) parts.push("Status: " + details.status);
  if (details.reason) parts.push("Reason: " + details.reason);
  if (Array.isArray(details.reasons) && details.reasons.length) parts.push("Reasons: " + details.reasons.join("; "));
  if (details.student_id) parts.push("Student: " + details.student_id);
  if (details.policy) parts.push("Policy: " + details.policy);
  if (details.academic_year) parts.push(details.academic_year + (details.semester ? " Sem " + details.semester : ""));
  if (!parts.length) return esc(JSON.stringify(details));
  return esc(parts.join(" | "));
}

async function submitAcademicSummary(ev) {
  ev.preventDefault();
  showMessage("");
  if (!currentScholar) { showMessage("Your account is not linked to a scholar record."); return; }
  const form = ev.currentTarget;
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const payload = {
      scholar_id: currentScholar.id,
      academic_year: "2026-2027",
      semester: 1,
      gwa: numberValue("gwa", false),
      units_enrolled: numberValue("units", true),
      failed_subjects: numberValue("failed", true),
      incomplete_subjects: numberValue("incompletes", true),
      dropped_subjects: numberValue("dropped", true),
      evidence_reference: byId("evidence").value.trim(),
      submission_status: "Pending",
      compliance_status: "Pending",
      verification_reason: null,
      verified_by: null,
      verified_at: null,
      evaluated_by: null,
      evaluated_at: null,
      deficiency_reasons: []
    };
    if (!payload.evidence_reference) throw new Error("Enter the evidence document reference.");
    let res;
    if (editingSubmissionId) {
      res = await supabaseClient.from("grade_submissions").update(payload).eq("id", editingSubmissionId);
    } else {
      res = await supabaseClient.from("grade_submissions").insert(payload);
    }
    if (res.error) {
      if (res.error.code === "23505") throw new Error("A submission already exists for this semester.");
      throw res.error;
    }
    await supabaseClient.from("audit_logs").insert({
      actor_id: currentUser.id,
      action: editingSubmissionId ? "RESUBMIT_CORRECTED_ACADEMIC_SUMMARY" : "SUBMIT_ACADEMIC_SUMMARY",
      entity_type: "academic_submission",
      entity_id: editingSubmissionId || null,
      details: { academic_year: "2026-2027", semester: 1 }
    });
    editingSubmissionId = null;
    byId("submission-heading").textContent = "Submit academic summary";
    byId("cancel-edit").classList.add("hidden");
    form.reset();
    byId("failed").value = "0";
    byId("incompletes").value = "0";
    byId("dropped").value = "0";
    showMessage("Academic summary submitted for verification.", true);
    await loadScholarSubmissions();
  } catch (e) {
    showMessage(rpcError(e));
  } finally {
    btn.disabled = false;
  }
}

async function loadScholarSubmissions() {
  if (!currentScholar) return;
  const box = byId("scholar-records");
  if (!box) return;
  box.innerHTML = "<p class='muted'>Loading submissions...</p>";
  const res = await supabaseClient
    .from("grade_submissions")
    .select("id,academic_year,semester,gwa,units_enrolled,submission_status,verification_reason,compliance_status,deficiency_reasons,submitted_at,renewal_decisions(decision,reason)")
    .eq("scholar_id", currentScholar.id)
    .order("submitted_at", { ascending: false });
  if (res.error) { box.textContent = res.error.message; return; }
  if (!res.data || !res.data.length) { box.innerHTML = "<p class='muted'>No submissions yet.</p>"; return; }
  let html = "<table><thead><tr><th>Term</th><th>GWA</th><th>Verification</th><th>Compliance</th><th>Renewal</th><th>Submitted</th></tr></thead><tbody>";
  res.data.forEach(function (r) {
    const reasons = Array.isArray(r.deficiency_reasons) ? r.deficiency_reasons.join(" ") : "";
    const renewal = r.renewal_decisions && r.renewal_decisions[0] ? r.renewal_decisions[0].decision : "Not decided";
    const correction = r.submission_status === "Returned"
      ? '<button class="secondary" type="button" data-correct="' + r.id + '">Correct and resubmit</button>'
      : "";
    html += "<tr><td>" + esc(r.academic_year) + " · Sem " + r.semester +
      "</td><td>" + Number(r.gwa).toFixed(2) +
      "</td><td>" + badge(r.submission_status) +
      (r.verification_reason ? "<div class='reason'>" + esc(r.verification_reason) + "</div>" : "") +
      "</td><td>" + badge(r.compliance_status) + "<div class='reason'>" + esc(reasons) + "</div>" +
      "</td><td>" + badge(renewal) +
      "</td><td>" + esc(formatManila(r.submitted_at)) + "<div>" + correction + "</div></td></tr>";
  });
  box.innerHTML = html + "</tbody></table>";
  box.querySelectorAll("button[data-correct]").forEach(function (btn) {
    btn.addEventListener("click", function () { beginCorrection(btn.dataset.correct); });
  });
}

async function beginCorrection(id) {
  const result = await supabaseClient.from("grade_submissions").select("*").eq("id", id).eq("submission_status", "Returned").maybeSingle();
  if (result.error || !result.data) {
    showMessage(result.error ? rpcError(result.error) : "Submission not found or not Returned.");
    return;
  }
  const r = result.data;
  editingSubmissionId = id;
  byId("gwa").value = r.gwa;
  byId("units").value = r.units_enrolled;
  byId("failed").value = r.failed_subjects;
  byId("incompletes").value = r.incomplete_subjects;
  byId("dropped").value = r.dropped_subjects;
  byId("evidence").value = r.evidence_reference;
  byId("submission-heading").textContent = "Correct returned submission";
  byId("cancel-edit").classList.remove("hidden");
  byId("submission-form").scrollIntoView({ behavior: "smooth", block: "start" });
  showMessage("Correct the fields, then resubmit for verification.");
}

function cancelCorrection() {
  editingSubmissionId = null;
  byId("submission-form").reset();
  byId("submission-heading").textContent = "Submit academic summary";
  byId("cancel-edit").classList.add("hidden");
}

async function registerScholar(ev) {
  ev.preventDefault();
  showMessage("");
  const form = ev.currentTarget;
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const policy = await supabaseClient.from("scholarship_programs").select("id").eq("program_name", byId("reg-policy").value).eq("active", true).maybeSingle();
    if (policy.error) throw policy.error;
    if (!policy.data) throw new Error("Scholarship policy not found. Seed Excellence/Access programs first.");
    const payload = {
      student_id: byId("reg-student-id").value.trim(),
      full_name: byId("reg-full-name").value.trim(),
      degree_program: byId("reg-program").value.trim(),
      scholarship_id: policy.data.id,
      created_by: currentUser.id
    };
    const result = await supabaseClient.from("scholars").insert(payload);
    if (result.error) {
      if (result.error.code === "23505") throw new Error("That student ID is already registered.");
      throw result.error;
    }
    await supabaseClient.from("audit_logs").insert({
      actor_id: currentUser.id,
      action: "REGISTER_SCHOLAR",
      entity_type: "scholar",
      details: { student_id: payload.student_id, policy: byId("reg-policy").value }
    });
    form.reset();
    showMessage("Scholar record registered. Link the scholar login in Supabase Auth.", true);
    await loadStaffDashboard();
    await loadAuditHistory();
  } catch (e) {
    showMessage(rpcError(e));
  } finally {
    btn.disabled = false;
  }
}

async function loadAuditHistory() {
  const box = byId("audit-records");
  if (!box) return;
  box.innerHTML = "<p class='muted'>Loading audit history...</p>";
  const result = await supabaseClient.from("audit_logs").select("id,actor_id,action,entity_type,entity_id,details,created_at").order("created_at", { ascending: false }).limit(50);
  if (result.error) { box.textContent = result.error.message; return; }
  if (!result.data || !result.data.length) { box.innerHTML = "<p class='muted'>No audit events yet.</p>"; return; }
  const actorIds = [...new Set(result.data.map(function (r) { return r.actor_id; }).filter(Boolean))];
  let nameMap = {};
  if (actorIds.length) {
    const names = await supabaseClient.from("profiles").select("id,full_name").in("id", actorIds);
    if (names.data) names.data.forEach(function (p) { nameMap[p.id] = p.full_name; });
  }
  let html = "<table><thead><tr><th>Time (Manila)</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>";
  result.data.forEach(function (r) {
    const actorName = nameMap[r.actor_id] || (r.actor_id ? String(r.actor_id).slice(0, 8) + "..." : "System");
    html += "<tr><td>" + esc(formatManila(r.created_at)) + "</td><td>" + esc(actorName) +
      "</td><td>" + esc(friendlyAction(r.action)) + "</td><td>" + esc(r.entity_type) +
      "</td><td>" + formatDetails(r.details) + "</td></tr>";
  });
  box.innerHTML = html + "</tbody></table>";
}

async function loadStaffDashboard() {
  const box = byId("staff-records");
  if (!box) return;
  box.innerHTML = "<p class='muted'>Loading records...</p>";
  const sch = await supabaseClient.from("scholars").select("id,student_id,full_name,degree_program,scholarship_programs(program_name)");
  if (sch.error) { box.textContent = sch.error.message; showMessage("Scholars query: " + sch.error.message); return; }
  const sub = await supabaseClient.from("grade_submissions").select("id,scholar_id,academic_year,semester,gwa,units_enrolled,failed_subjects,incomplete_subjects,dropped_subjects,evidence_reference,submitted_at,submission_status,verification_reason,compliance_status,deficiency_reasons,renewal_decisions(decision,reason)").order("submitted_at", { ascending: false });
  if (sub.error) { box.textContent = sub.error.message; showMessage("Submissions query: " + sub.error.message); return; }
  staffRows = (sub.data || []).map(function (s) {
    s.scholar = (sch.data || []).find(function (x) { return x.id === s.scholar_id; });
    return s;
  });
  if (byId("metric-assigned")) byId("metric-assigned").textContent = (sch.data || []).length;
  if (byId("metric-pending")) byId("metric-pending").textContent = staffRows.filter(function (r) { return r.submission_status === "Pending"; }).length;
  if (byId("metric-compliant")) byId("metric-compliant").textContent = staffRows.filter(function (r) { return r.compliance_status === "Compliant"; }).length;
  if (byId("metric-deficiency")) byId("metric-deficiency").textContent = staffRows.filter(function (r) { return r.compliance_status === "With Deficiency"; }).length;
  const progSelect = byId("filter-program");
  if (progSelect) {
    const programs = [...new Set((sch.data || []).map(function (s) { return s.scholarship_programs && s.scholarship_programs.program_name; }).filter(Boolean))];
    const current = progSelect.value;
    progSelect.innerHTML = '<option value="">All programs</option>' + programs.map(function (p) { return '<option value="' + esc(p) + '">' + esc(p) + "</option>"; }).join("");
    if (current) progSelect.value = current;
  }
  renderStaffRows();
}

function renderStaffRows() {
  const box = byId("staff-records");
  if (!box) return;
  const term = ((byId("search-scholars") && byId("search-scholars").value) || "").toLowerCase();
  const filter = (byId("filter-compliance") && byId("filter-compliance").value) || "";
  const prog = (byId("filter-program") && byId("filter-program").value) || "";
  const rows = staffRows.filter(function (r) {
    const s = r.scholar || {};
    const nameMatch = ((s.student_id || "") + " " + (s.full_name || "")).toLowerCase().includes(term);
    const compMatch = !filter || r.compliance_status === filter;
    const progMatch = !prog || (s.scholarship_programs && s.scholarship_programs.program_name === prog);
    return nameMatch && compMatch && progMatch;
  });
  if (!rows.length) {
    box.innerHTML = "<p class='muted'>No matching submissions.</p>";
    return;
  }
  let html = "<table><thead><tr><th>Scholar</th><th>Policy</th><th>Academic summary</th><th>Verification</th><th>Compliance</th><th>Renewal</th><th>Actions</th></tr></thead><tbody>";
  rows.forEach(function (r) {
    const s = r.scholar || {};
    const policy = s.scholarship_programs ? s.scholarship_programs.program_name : "-";
    const reasons = Array.isArray(r.deficiency_reasons) ? r.deficiency_reasons.join(" ") : "";
    const renewal = r.renewal_decisions && r.renewal_decisions[0] ? r.renewal_decisions[0].decision : "Not decided";
    let actions = "";
    if (r.submission_status === "Pending") {
      actions += '<button class="primary" type="button" data-action="verify" data-id="' + r.id + '">Verify</button> ';
      actions += '<button class="secondary" type="button" data-action="return" data-id="' + r.id + '">Return</button>';
    }
    if (r.submission_status === "Verified" && (!r.compliance_status || r.compliance_status === "Pending")) {
      actions += '<button class="secondary" type="button" data-action="evaluate" data-id="' + r.id + '">Evaluate</button>';
    }
    if (r.submission_status === "Verified" && r.compliance_status === "Compliant") {
      actions += ' <button class="primary" type="button" data-action="approve" data-id="' + r.id + '">Approve</button>';
    }
    if (r.submission_status === "Verified" && r.compliance_status && r.compliance_status !== "Pending") {
      actions += ' <button class="secondary" type="button" data-action="hold" data-id="' + r.id + '">Hold</button>';
    }
    if (!actions) actions = "-";
    html += "<tr><td><strong>" + esc(s.full_name || "Unknown") + "</strong><div class='reason'>" +
      esc(s.student_id || "") + " · " + esc(s.degree_program || "") +
      "</div></td><td>" + esc(policy) +
      "</td><td>GWA " + Number(r.gwa).toFixed(2) +
      "<div class='reason'>" + r.units_enrolled + " units · Failed " + r.failed_subjects +
      " · INC " + r.incomplete_subjects + " · Dropped " + r.dropped_subjects +
      "</div><div class='reason'>" + esc(r.evidence_reference) +
      "</div><div class='reason'>Submitted: " + esc(formatManila(r.submitted_at)) +
      "</div></td><td>" + badge(r.submission_status) +
      (r.verification_reason ? "<div class='reason'>" + esc(r.verification_reason) + "</div>" : "") +
      "</td><td>" + badge(r.compliance_status) + "<div class='reason'>" + esc(reasons) +
      "</div></td><td>" + badge(renewal) +
      "</td><td class='actions'>" + actions + "</td></tr>";
  });
  box.innerHTML = html + "</tbody></table>";
  box.querySelectorAll("button[data-action]").forEach(function (btn) {
    btn.addEventListener("click", function () { handleStaffAction(btn.dataset.action, btn.dataset.id); });
  });
}

async function handleStaffAction(action, id) {
  showMessage("");
  try {
    if (action === "verify" || action === "return") {
      const reason = action === "return" ? prompt("Enter the reason for returning this submission:") : null;
      if (action === "return" && (!reason || !reason.trim())) { showMessage("Return requires a reason."); return; }
      const result = await supabaseClient.rpc("staff_verify_submission", {
        p_submission_id: id,
        p_decision: action === "verify" ? "Verified" : "Returned",
        p_reason: reason
      });
      if (result.error) throw result.error;
      showMessage(action === "verify" ? "Evidence marked Verified." : "Submission returned for correction.", true);
    } else if (action === "evaluate") {
      const result = await supabaseClient.rpc("staff_evaluate_submission", { p_submission_id: id });
      if (result.error) throw result.error;
      let status = "done";
      if (result.data) {
        if (typeof result.data === "string") status = result.data;
        else if (result.data.status) status = result.data.status;
      }
      showMessage("Evaluation completed: " + status + ".", true);
    } else if (action === "approve" || action === "hold") {
      const reason = action === "hold" ? prompt("Reason for holding renewal:") : null;
      if (action === "hold" && (!reason || !reason.trim())) { showMessage("Hold requires a reason."); return; }
      if (!confirm(action === "approve" ? "Approve renewal for this compliant submission?" : "Hold renewal for this scholar?")) return;
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
  return '<span class="status ' + cls + '">' + esc(value || "Pending") + "</span>";
}

function esc(value) {
  var s = String(value == null ? "" : value);
  s = s.split("&").join("&" + "amp;");
  s = s.split("<").join("&" + "lt;");
  s = s.split(">").join("&" + "gt;");
  s = s.split('"').join("&" + "quot;");
  s = s.split("'").join("&#39;");
  return s;
}
