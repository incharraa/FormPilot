import { useEffect, useRef, useState } from "react";

 

 

 

import { supabase } from "./supabase";

 

 

 

import "./App.css";

 

 

 

 

 

 

 

const createQuestion = () => ({

 

 

 

  id: crypto.randomUUID(),

 

 

 

  text: "",

 

 

 

  options: ["", ""],

 

 

 

  correctAnswer: 0,

 

 

 

  marks: 1,

 

 

 

});

 

 

 

 

 

 

 

function formatTime(seconds) {

 

 

 

  const safe = Math.max(0, Number(seconds) || 0);

 

 

 

  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(

 

 

 

    safe % 60

 

 

 

  ).padStart(2, "0")}`;

 

 

 

}

 

 

 

 

 

 

 

function App() {

 

 

 

  const [page, setPage] = useState("home");

 

 

 

  const [session, setSession] = useState(null);

 

 

 

  const [authLoading, setAuthLoading] = useState(true);

 

 

 

  const [authError, setAuthError] = useState("");

 

 

 

  const [title, setTitle] = useState("");

 

 

 

  const [description, setDescription] = useState("");

 

 

 

  const [duration, setDuration] = useState("30");

 

 

 

  const [warningLimit, setWarningLimit] = useState("3");

 

 

 

  const [questions, setQuestions] = useState([createQuestion()]);

  const [draftId, setDraftId] = useState(null);

  const [drafts, setDrafts] = useState([]);

  const [draftsLoading, setDraftsLoading] = useState(false);

  const [draftSaving, setDraftSaving] = useState(false);

  const [analyticsData, setAnalyticsData] = useState(null);

  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [analyticsError, setAnalyticsError] = useState("");

  const [selectedQuizAnalytics, setSelectedQuizAnalytics] = useState(null);

  const [studentName, setStudentName] = useState("");

  const [studentRegisterNumber, setStudentRegisterNumber] = useState("");

  const [studentEmail, setStudentEmail] = useState("");

 

 

 

  const [previewIndex, setPreviewIndex] = useState(0);

 

 

 

 

 

 

 

  const [studentQuiz, setStudentQuiz] = useState(null);

 

 

 

  const [shareCode, setShareCode] = useState("");

 

 

 

  const [shareLink, setShareLink] = useState("");

 

 

 

  const [publishing, setPublishing] = useState(false);

 

 

 

  const [loadingQuiz, setLoadingQuiz] = useState(false);

 

 

 

  const [errorMessage, setErrorMessage] = useState("");

 

 

 

 

 

 

 

  const [timeLeft, setTimeLeft] = useState(0);

 

 

 

  const [quizStarted, setQuizStarted] = useState(false);

 

 

 

  const [quizSubmitted, setQuizSubmitted] = useState(false);

 

 

 

  const [studentAnswers, setStudentAnswers] = useState({});

 

 

 

  const [finalResult, setFinalResult] = useState(null);

 

 

 

  const [tabWarnings, setTabWarnings] = useState(0);

 

 

 

 

 

 

 

  const timerRef = useRef(null);

 

 

 

  const deadlineRef = useRef(null);

 

 

 

  const submittedRef = useRef(false);

 

 

 

  const answersRef = useRef({});

 

 

 

  const warningsRef = useRef(0);

  const attemptStartedAtRef = useRef(null);

 

 

 

 

 

 

 

  const isSharedAttempt = Boolean(studentQuiz);

 

 

 

  const activeTitle = isSharedAttempt ? studentQuiz.title : title;

 

 

 

  const activeDescription = isSharedAttempt

 

 

 

    ? studentQuiz.description

 

 

 

    : description;

 

 

 

  const activeDuration = isSharedAttempt ? studentQuiz.duration : Number(duration);

 

 

 

  const activeWarningLimit = isSharedAttempt

 

 

 

    ? studentQuiz.warning_limit

 

 

 

    : Number(warningLimit);

 

 

 

  const activeQuestions = isSharedAttempt ? studentQuiz.questions : questions;

 

 

 

 

 

 

 

  function goTo(nextPage) {

 

 

 

    setPage(nextPage);

 

 

 

    window.scrollTo(0, 0);

 

 

 

  }

 

 

 

 

 

 

 

  async function signInWithGoogle() {

 

 

 

    setAuthError("");

 

 

 

    try {

 

 

 

      const { error } = await supabase.auth.signInWithOAuth({

 

 

 

        provider: "google",

 

 

 

        options: { redirectTo: window.location.origin },

 

 

 

      });

 

 

 

      if (error) throw error;

 

 

 

    } catch (error) {

 

 

 

      console.error("Google sign-in error:", error);

 

 

 

      setAuthError(error.message || "Could not start Google sign-in.");

 

 

 

      alert(error.message || "Could not start Google sign-in.");

 

 

 

    }

 

 

 

  }

 

 

 

 

 

 

 

  async function signOut() {

 

 

 

    const { error } = await supabase.auth.signOut();

 

 

 

    if (error) {

 

 

 

      setAuthError(error.message || "Could not sign out.");

 

 

 

      alert(error.message || "Could not sign out.");

 

 

 

      return;

 

 

 

    }

 

 

 

    setPage("home");

 

 

 

    setAuthError("");

 

 

 

  }

 

 

 

 

 

 

 

  async function loadAnalytics() {

    if (!session?.user?.id) return;

    setAnalyticsLoading(true);

    setAnalyticsError("");

    try {

      const { data, error } = await supabase.rpc("get_teacher_analytics");

      if (error) throw error;

      setAnalyticsData(data || { quiz_count: 0, attempt_count: 0, average_percent: 0, quizzes: [] });

    } catch (error) {

      console.error("Analytics load error:", error);

      setAnalyticsError(error.message || "Could not load analytics. Run the analytics SQL migration in Supabase first.");

    } finally {

      setAnalyticsLoading(false);

    }

  }

 

  async function openQuizAnalytics(quizId) {

    setAnalyticsLoading(true);

    setAnalyticsError("");

    try {

      const { data, error } = await supabase.rpc("get_quiz_analytics", { p_quiz_id: quizId });

      if (error) throw error;

      setSelectedQuizAnalytics(data);

      goTo("quiz-analytics");

    } catch (error) {

      console.error("Quiz analytics error:", error);

      setAnalyticsError(error.message || "Could not load this quiz report.");

      alert(error.message || "Could not load this quiz report.");

    } finally {

      setAnalyticsLoading(false);

    }

  }

 

  function downloadQuizCsv() {

    const report = selectedQuizAnalytics;

    if (!report?.attempts?.length) {

      alert("There are no attempts to export yet.");

      return;

    }

    const columns = ["Student name", "Register number", "Email", "Score", "Total marks", "Percentage", "Time taken (seconds)", "Tab warnings", "Submission reason", "Submitted at"];

    const rows = report.attempts.map((attempt) => [attempt.student_name, attempt.register_number, attempt.student_email, attempt.score, attempt.total_marks, attempt.total_marks > 0 ? (Number(attempt.score) / Number(attempt.total_marks) * 100).toFixed(2) : "0", attempt.duration_seconds, attempt.tab_warnings, attempt.submission_reason, attempt.submitted_at]);

    const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

    const csv = [columns, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");

    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `${(report.quiz?.title || "quiz-results").replace(/[^a-z0-9-_]+/gi, "-")}-results.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

  }

 

  useEffect(() => {

    if (page === "dashboard" && session?.user?.id) {

      loadDrafts();

      loadAnalytics();

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [page, session?.user?.id]);

 

  function openDashboard() {

 

    if (!session) {

 

      signInWithGoogle();

 

      return;

 

    }

 

    goTo("dashboard");

 

  }

 

 

 

  function openBuilder() {

 

 

 

    if (!session) {

 

 

 

      localStorage.setItem("formpilot-open-builder-after-login", "yes");

 

 

 

      signInWithGoogle();

 

 

 

      return;

 

 

 

    }

 

 

 

    setDraftId(null);

 

    setStudentQuiz(null);

 

 

 

    setShareCode("");

 

 

 

    setShareLink("");

 

 

 

    setErrorMessage("");

 

 

 

    goTo("builder");

 

 

 

  }

 

 

 

 

 

 

 

  function updateQuestion(id, field, value) {

 

 

 

    setQuestions((previous) =>

 

 

 

      previous.map((question) =>

 

 

 

        question.id === id ? { ...question, [field]: value } : question

 

 

 

      )

 

 

 

    );

 

 

 

  }

 

 

 

 

 

 

 

  function updateOption(id, optionIndex, value) {

 

 

 

    setQuestions((previous) =>

 

 

 

      previous.map((question) =>

 

 

 

        question.id === id

 

 

 

          ? {

 

 

 

              ...question,

 

 

 

              options: question.options.map((option, index) =>

 

 

 

                index === optionIndex ? value : option

 

 

 

              ),

 

 

 

            }

 

 

 

          : question

 

 

 

      )

 

 

 

    );

 

 

 

  }

 

 

 

 

 

 

 

  function addOption(id) {

 

 

 

    setQuestions((previous) =>

 

 

 

      previous.map((question) =>

 

 

 

        question.id === id

 

 

 

          ? { ...question, options: [...question.options, ""] }

 

 

 

          : question

 

 

 

      )

 

 

 

    );

 

 

 

  }

 

 

 

 

 

 

 

  function deleteOption(id, optionIndex) {

 

 

 

    setQuestions((previous) =>

 

 

 

      previous.map((question) => {

 

 

 

        if (question.id !== id || question.options.length <= 2) return question;

 

 

 

        const options = question.options.filter((_, index) => index !== optionIndex);

 

 

 

        let correctAnswer = question.correctAnswer;

 

 

 

        if (optionIndex === correctAnswer) correctAnswer = 0;

 

 

 

        else if (optionIndex < correctAnswer) correctAnswer -= 1;

 

 

 

        return { ...question, options, correctAnswer };

 

 

 

      })

 

 

 

    );

 

 

 

  }

 

 

 

 

 

 

 

  function addQuestion() {

 

 

 

    setQuestions((previous) => [...previous, createQuestion()]);

 

 

 

  }

 

 

 

 

 

 

 

  function deleteQuestion(id) {

 

 

 

    setQuestions((previous) => {

 

 

 

      if (previous.length <= 1) return previous;

 

 

 

      return previous.filter((question) => question.id !== id);

 

 

 

    });

 

 

 

  }

 

 

 

 

 

 

 

  async function saveDraft() {

    if (!session?.user?.id) {

      alert("Please sign in with Google before saving a cloud draft.");

      return;

    }

    if (!title.trim()) {

      alert("Please enter a quiz title before saving the draft.");

      return;

    }

    setDraftSaving(true);

    setErrorMessage("");

    const draftRecord = {

      owner_id: session.user.id,

      title: title.trim(),

      description: description || "",

      duration: Number(duration) || 30,

      warning_limit: Number(warningLimit) || 3,

      questions: questions.map((question) => ({ ...question, marks: Number(question.marks) || 1 })),

      updated_at: new Date().toISOString(),

    };

    try {

      const result = draftId

        ? await supabase.from("quiz_drafts").update(draftRecord).eq("id", draftId).eq("owner_id", session.user.id).select("id").single()

        : await supabase.from("quiz_drafts").insert(draftRecord).select("id").single();

      if (result.error) throw result.error;

      setDraftId(result.data.id);

      await loadDrafts();

      alert("Draft saved to your FormPilot account!");

    } catch (error) {

      console.error("Save cloud draft error:", error);

      setErrorMessage(error.message || "Could not save the draft to Supabase.");

      alert(`Could not save draft.\n\n${error.message || "Check your login and Supabase permissions."}`);

    } finally {

      setDraftSaving(false);

    }

  }

 

  async function loadDrafts() {

    if (!session?.user?.id) { setDrafts([]); return; }

    setDraftsLoading(true);

    try {

      const { data, error } = await supabase.from("quiz_drafts")

        .select("id, title, description, duration, warning_limit, questions, created_at, updated_at")

        .eq("owner_id", session.user.id).order("updated_at", { ascending: false });

      if (error) throw error;

      setDrafts(data || []);

    } catch (error) {

      console.error("Load drafts error:", error);

      setErrorMessage(error.message || "Could not load your drafts.");

    } finally { setDraftsLoading(false); }

  }

 

  function openDraft(draft) {

    setDraftId(draft.id);

    setTitle(draft.title || "");

    setDescription(draft.description || "");

    setDuration(String(draft.duration || 30));

    setWarningLimit(String(draft.warning_limit || 3));

    setQuestions(Array.isArray(draft.questions) && draft.questions.length ? draft.questions : [createQuestion()]);

    setStudentQuiz(null);

    setShareCode("");

    setShareLink("");

    setErrorMessage("");

    goTo("builder");

  }

 

  async function deleteDraft(id) {

    if (!session?.user?.id || !window.confirm("Delete this draft permanently?")) return;

    try {

      const { error } = await supabase.from("quiz_drafts").delete().eq("id", id).eq("owner_id", session.user.id);

      if (error) throw error;

      if (draftId === id) setDraftId(null);

      await loadDrafts();

      alert("Draft deleted.");

    } catch (error) {

      console.error("Delete draft error:", error);

      alert(`Could not delete draft.\n\n${error.message || "Please try again."}`);

    }

  }

 

  function validateQuiz() {

 

 

 

    if (!title.trim()) return "Please enter a quiz title first.";

 

 

 

    if (!questions.length) return "Please add at least one question.";

 

 

 

    for (let i = 0; i < questions.length; i += 1) {

 

 

 

      const question = questions[i];

 

 

 

      if (!question.text.trim()) return `Please enter the text for question ${i + 1}.`;

 

 

 

      if (question.options.length < 2 || question.options.some((option) => !option.trim())) {

 

 

 

        return `Please fill in at least two options for question ${i + 1}.`;

 

 

 

      }

 

 

 

    }

 

 

 

    return "";

 

 

 

  }

 

 

 

 

 

 

 

  function startPreview() {

 

 

 

    const problem = validateQuiz();

 

 

 

    if (problem) {

 

 

 

      alert(problem);

 

 

 

      return;

 

 

 

    }

 

 

 

    setPreviewIndex(0);

 

 

 

    goTo("preview");

 

 

 

  }

 

 

 

 

 

 

 

  async function publishQuiz() {

 

 

 

    if (!session) {

 

 

 

      alert("Please sign in with Google before publishing a quiz.");

 

 

 

      signInWithGoogle();

 

 

 

      return;

 

 

 

    }

 

 

 

    const problem = validateQuiz();

 

 

 

    if (problem) {

 

 

 

      alert(problem);

 

 

 

      return;

 

 

 

    }

 

 

 

 

 

 

 

    setPublishing(true);

 

 

 

    setErrorMessage("");

 

 

 

    try {

 

 

 

      const { data, error } = await supabase.rpc("publish_quiz", {

 

 

 

        p_title: title.trim(),

 

 

 

        p_description: description,

 

 

 

        p_duration: Number(duration),

 

 

 

        p_warning_limit: Number(warningLimit),

 

 

 

        p_questions: questions.map((question) => ({

 

 

 

          id: question.id,

 

 

 

          text: question.text,

 

 

 

          options: question.options,

 

 

 

          correctAnswer: question.correctAnswer,

 

 

 

          marks: Number(question.marks) || 1,

 

 

 

        })),

 

 

 

      });

 

 

 

 

 

 

 

      if (error) throw error;

 

 

 

      const code = data?.share_code;

 

 

 

      if (!code) throw new Error("Supabase did not return a share code.");

 

 

 

 

 

 

 

      const url = new URL(window.location.href);

 

 

 

      url.search = "";

 

 

 

      url.searchParams.set("quiz", code);

 

 

 

      setShareCode(code);

 

 

 

      setShareLink(url.toString());

 

 

 

      alert("Quiz published! Copy the link and share it with students.");

 

 

 

    } catch (error) {

 

 

 

      console.error("Publish quiz error:", error);

 

 

 

      setErrorMessage(error.message || "Could not publish the quiz.");

 

 

 

      alert(`Could not publish the quiz.\n\n${error.message || "Check your Supabase settings and SQL functions."}`);

 

 

 

    } finally {

 

 

 

      setPublishing(false);

 

 

 

    }

 

 

 

  }

 

 

 

 

 

 

 

  async function copyShareLink() {

 

 

 

    if (!shareLink) return;

 

 

 

    try {

 

 

 

      await navigator.clipboard.writeText(shareLink);

 

 

 

      alert("Quiz link copied!");

 

 

 

    } catch {

 

 

 

      window.prompt("Copy this quiz link:", shareLink);

 

 

 

    }

 

 

 

  }

 

 

 

 

 

 

 

  async function loadSharedQuiz(code) {

 

 

 

    setLoadingQuiz(true);

 

 

 

    setErrorMessage("");

 

 

 

    try {

 

 

 

      const { data, error } = await supabase.rpc("get_quiz", {

 

 

 

        p_share_code: code,

 

 

 

      });

 

 

 

      if (error) throw error;

 

 

 

      if (!data) throw new Error("This quiz link is invalid or the quiz does not exist.");

 

 

 

      setStudentQuiz(data);

      setShareCode(code);

      setStudentName("");

      setStudentRegisterNumber("");

      setStudentEmail("");

 

 

 

      setTitle(data.title || "");

 

 

 

      setDescription(data.description || "");

 

 

 

      setDuration(String(data.duration || 30));

 

 

 

      setWarningLimit(String(data.warning_limit || 3));

 

 

 

      setQuestions(data.questions || []);

 

 

 

      setPreviewIndex(0);

 

 

 

      setStudentAnswers({});

 

 

 

      answersRef.current = {};

 

 

 

      setFinalResult(null);

 

 

 

      setQuizSubmitted(false);

 

 

 

      setQuizStarted(false);

 

 

 

      goTo("student-start");

 

 

 

    } catch (error) {

 

 

 

      console.error("Load quiz error:", error);

 

 

 

      setErrorMessage(error.message || "Unable to load this quiz.");

 

 

 

      goTo("link-error");

 

 

 

    } finally {

 

 

 

      setLoadingQuiz(false);

 

 

 

    }

 

 

 

  }

 

 

 

 

 

 

 

  useEffect(() => {

 

 

 

    let mounted = true;

 

 

 

 

 

 

 

    async function loadSession() {

 

 

 

      const { data, error } = await supabase.auth.getSession();

 

 

 

      if (!mounted) return;

 

 

 

      if (error) {

 

 

 

        console.error("Session error:", error);

 

 

 

        setAuthError(error.message || "Could not check your login session.");

 

 

 

      }

 

 

 

      setSession(data?.session ?? null);

 

 

 

      setAuthLoading(false);

 

 

 

      if (data?.session && localStorage.getItem("formpilot-open-builder-after-login") === "yes") {

 

 

 

        localStorage.removeItem("formpilot-open-builder-after-login");

 

 

 

        setPage("builder");

 

 

 

      }

 

 

 

    }

 

 

 

 

 

 

 

    loadSession();

 

 

 

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {

 

 

 

      setSession(newSession);

 

 

 

      setAuthLoading(false);

 

 

 

      if (newSession && localStorage.getItem("formpilot-open-builder-after-login") === "yes") {

 

 

 

        localStorage.removeItem("formpilot-open-builder-after-login");

 

 

 

        setPage("builder");

 

 

 

      }

 

 

 

    });

 

 

 

 

 

 

 

    return () => {

 

 

 

      mounted = false;

 

 

 

      subscription.unsubscribe();

 

 

 

    };

 

 

 

  }, []);

 

 

 

 

 

 

 

  useEffect(() => {

 

 

 

    const code = new URLSearchParams(window.location.search).get("quiz");

 

 

 

    if (code) loadSharedQuiz(code);

 

 

 

    // Only load the shared quiz once when the app opens.

 

 

 

    // eslint-disable-next-line react-hooks/exhaustive-deps

 

 

 

  }, []);

 

 

 

 

 

 

 

  function startQuizAttempt() {

 

 

 

    if (!studentName.trim() || !studentRegisterNumber.trim() || !studentEmail.trim()) {

      alert("Please enter your name, register number, and email before starting.");

      return;

    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail.trim())) {

      alert("Please enter a valid email address.");

      return;

    }

 

    const list = activeQuestions;

 

 

 

    if (!list?.length || list.some((question) =>

 

 

 

      !question.text?.trim() || !Array.isArray(question.options) ||

 

 

 

      question.options.length < 2 || question.options.some((option) => !String(option).trim())

 

 

 

    )) {

 

 

 

      alert("This quiz has incomplete questions and cannot be started.");

 

 

 

      return;

 

 

 

    }

 

 

 

    if (timerRef.current) clearInterval(timerRef.current);

 

 

 

    answersRef.current = {};

 

 

 

    warningsRef.current = 0;

 

 

 

    submittedRef.current = false;

 

 

 

    setStudentAnswers({});

 

 

 

    setTabWarnings(0);

 

 

 

    setFinalResult(null);

 

 

 

    setQuizSubmitted(false);

 

 

 

    setPreviewIndex(0);

 

 

 

    attemptStartedAtRef.current = Date.now();

    deadlineRef.current = Date.now() + Number(activeDuration) * 60 * 1000;

 

 

 

    setTimeLeft(Number(activeDuration) * 60);

 

 

 

    setQuizStarted(true);

 

 

 

    goTo("attempt");

 

 

 

  }

 

 

 

 

 

 

 

  async function submitQuiz(reason = "manual") {

 

 

 

    if (submittedRef.current) return;

 

 

 

    submittedRef.current = true;

 

 

 

    if (timerRef.current) {

 

 

 

      clearInterval(timerRef.current);

 

 

 

      timerRef.current = null;

 

 

 

    }

 

 

 

 

 

 

 

    let result;

 

 

 

    if (isSharedAttempt && shareCode) {

 

 

 

      try {

 

 

 

        const answersForServer = Object.fromEntries(

 

 

 

          Object.entries(answersRef.current).map(([id, index]) => [id, String(index)])

 

 

 

        );

 

 

 

        const { data, error } = await supabase.rpc("submit_quiz_and_record", {

          p_share_code: shareCode,

          p_answers: answersForServer,

          p_student_name: studentName.trim(),

          p_register_number: studentRegisterNumber.trim(),

          p_student_email: studentEmail.trim(),

          p_tab_warnings: Number(warningsRef.current) || 0,

          p_submission_reason: reason,

          p_duration_seconds: Math.max(0, Math.floor((Date.now() - (attemptStartedAtRef.current || Date.now())) / 1000)),

        });

 

 

 

        if (error) throw error;

 

 

 

        result = {

 

 

 

          quizTitle: activeTitle,

 

 

 

          answers: answersRef.current,

 

 

 

          score: Number(data?.score ?? 0),

 

 

 

          totalMarks: Number(data?.totalMarks ?? 0),

 

 

 

          reason,

 

 

 

          submittedAt: new Date().toISOString(),

 

 

 

        };

 

 

 

      } catch (error) {

 

 

 

        console.error("Submit quiz error:", error);

 

 

 

        result = {

 

 

 

          quizTitle: activeTitle,

 

 

 

          answers: answersRef.current,

 

 

 

          score: null,

 

 

 

          totalMarks: null,

 

 

 

          reason,

 

 

 

          submittedAt: new Date().toISOString(),

 

 

 

          error: error.message || "The server could not grade this attempt.",

 

 

 

        };

 

 

 

      }

 

 

 

    } else {

 

 

 

      const score = activeQuestions.reduce(

 

 

 

        (total, question) =>

 

 

 

          total + (answersRef.current[question.id] === question.correctAnswer

 

 

 

            ? Number(question.marks) || 1

 

 

 

            : 0),

 

 

 

        0

 

 

 

      );

 

 

 

      const totalMarks = activeQuestions.reduce(

 

 

 

        (total, question) => total + (Number(question.marks) || 1), 0

 

 

 

      );

 

 

 

      result = {

 

 

 

        quizTitle: activeTitle,

 

 

 

        answers: answersRef.current,

 

 

 

        score,

 

 

 

        totalMarks,

 

 

 

        reason,

 

 

 

        submittedAt: new Date().toISOString(),

 

 

 

      };

 

 

 

    }

 

 

 

 

 

 

 

    setFinalResult(result);

 

 

 

    setQuizSubmitted(true);

 

 

 

    setQuizStarted(false);

 

 

 

    setTimeLeft(0);

 

 

 

  }

 

 

 

 

 

 

 

  useEffect(() => {

 

 

 

    if (!quizStarted || quizSubmitted || page !== "attempt") return undefined;

 

 

 

 

 

 

 

    const updateCountdown = () => {

 

 

 

      const remaining = Math.max(

 

 

 

        0,

 

 

 

        Math.ceil((deadlineRef.current - Date.now()) / 1000)

 

 

 

      );

 

 

 

      setTimeLeft(remaining);

 

 

 

      if (remaining <= 0) submitQuiz("time");

 

 

 

    };

 

 

 

 

 

 

 

    updateCountdown();

 

 

 

    timerRef.current = setInterval(updateCountdown, 250);

 

 

 

    return () => {

 

 

 

      if (timerRef.current) {

 

 

 

        clearInterval(timerRef.current);

 

 

 

        timerRef.current = null;

 

 

 

      }

 

 

 

    };

 

 

 

    // submitQuiz uses current refs and stable quiz state for this attempt.

 

 

 

    // eslint-disable-next-line react-hooks/exhaustive-deps

 

 

 

  }, [quizStarted, quizSubmitted, page]);

 

 

 

 

 

 

 

  useEffect(() => {

 

 

 

    if (!quizStarted || quizSubmitted || page !== "attempt") return undefined;

 

 

 

    const onVisibilityChange = () => {

 

 

 

      if (document.visibilityState !== "hidden" || submittedRef.current) return;

 

 

 

      warningsRef.current += 1;

 

 

 

      setTabWarnings(warningsRef.current);

 

 

 

      if (warningsRef.current >= Number(activeWarningLimit)) {

 

 

 

        submitQuiz("tab-switch");

 

 

 

      } else {

 

 

 

        alert(`Warning ${warningsRef.current} of ${activeWarningLimit}: Please stay on the quiz tab.`);

 

 

 

      }

 

 

 

    };

 

 

 

    document.addEventListener("visibilitychange", onVisibilityChange);

 

 

 

    return () => document.removeEventListener("visibilitychange", onVisibilityChange);

 

 

 

    // eslint-disable-next-line react-hooks/exhaustive-deps

 

 

 

  }, [quizStarted, quizSubmitted, page, activeWarningLimit]);

 

 

 

 

 

 

 

  useEffect(() => () => {

 

 

 

    if (timerRef.current) clearInterval(timerRef.current);

 

 

 

  }, []);

 

 

 

 

 

 

 

  function chooseAnswer(questionId, optionIndex) {

 

 

 

    const updated = { ...answersRef.current, [questionId]: optionIndex };

 

 

 

    answersRef.current = updated;

 

 

 

    setStudentAnswers(updated);

 

 

 

  }

 

 

 

 

 

 

 

  if (loadingQuiz) {

 

 

 

    return <div className="student-preview-page"><main className="student-preview-main"><section className="student-quiz-card"><h1>Loading quiz…</h1><p>Please wait while FormPilot loads the quiz.</p></section></main></div>;

 

 

 

  }

 

 

 

 

 

 

 

  if (page === "link-error") {

 

 

 

    return <div className="student-preview-page"><main className="student-preview-main"><section className="student-quiz-card"><h1>Quiz link unavailable</h1><p>{errorMessage}</p><button className="primary-button" onClick={() => { window.history.replaceState({}, "", window.location.pathname); setErrorMessage(""); goTo("home"); }}>Go to FormPilot</button></section></main></div>;

 

 

 

  }

 

 

 

 

 

 

 

  if (page === "dashboard") {

 

    const user = session?.user;

 

    const teacherName =

 

      user?.user_metadata?.full_name ||

 

      user?.user_metadata?.name ||

 

      user?.user_metadata?.given_name ||

 

      "Teacher";

 

 

 

    return (

 

      <div className="builder-page">

 

        <header className="builder-navbar">

 

          <button

 

            className="logo logo-button"

 

            onClick={() => goTo("home")}

 

          >

 

            <span className="logo-icon">F</span>

 

            FormPilot

 

          </button>

 

 

 

          <div className="builder-actions">

 

            <button

 

              className="secondary-button"

 

              onClick={() => goTo("home")}

 

            >

 

              Home

 

            </button>

 

            <button className="secondary-button" onClick={loadAnalytics} disabled={analyticsLoading}>{analyticsLoading ? "Refreshing…" : "Refresh analytics"}</button>

            <button className="secondary-button" onClick={signOut}>

 

              Sign out

 

            </button>

 

          </div>

 

        </header>

 

 

 

        <main className="builder-main">

 

          <div className="builder-heading">

 

            <span className="eyebrow">TEACHER DASHBOARD</span>

 

            <h1>Welcome, {teacherName}!</h1>

 

            <p>Manage your FormPilot account and create quizzes.</p>

 

          </div>

 

 

 

          <section className="builder-card">

 

            <h2>Your Profile</h2>

 

            <p><strong>Name:</strong> {teacherName}</p>

 

            <p><strong>Email:</strong> {user?.email || "Not available"}</p>

 

            <p><strong>Login method:</strong> Google</p>

 

          </section>

 

          <section className="builder-card analytics-overview-card">

            <div className="builder-section-title"><div><span className="eyebrow">PERFORMANCE CENTER</span><h2>Quiz analytics</h2><p>Real results from student attempts on quizzes published by your account.</p></div><span className="analytics-mark">↗</span></div>

            {analyticsError && <p className="analytics-error" role="alert">{analyticsError}</p>}

            {analyticsLoading && !analyticsData ? <p>Loading your quiz analytics…</p> : <>

              <div className="analytics-stat-grid">

                <article className="analytics-stat"><span className="analytics-stat-icon">▤</span><span className="analytics-stat-label">Published quizzes</span><strong>{analyticsData?.quiz_count ?? 0}</strong><small>Your published assessments</small></article>

                <article className="analytics-stat"><span className="analytics-stat-icon green">✓</span><span className="analytics-stat-label">Student attempts</span><strong>{analyticsData?.attempt_count ?? 0}</strong><small>Recorded submissions</small></article>

                <article className="analytics-stat"><span className="analytics-stat-icon orange">◎</span><span className="analytics-stat-label">Average score</span><strong>{Number(analyticsData?.average_percent || 0).toFixed(1)}%</strong><small>Across recorded attempts</small></article>

              </div>

              <div className="analytics-list-heading"><div><h3>Performance by quiz</h3><p>Select a published quiz to see its detailed report.</p></div><button className="secondary-button" onClick={loadAnalytics} disabled={analyticsLoading}>Refresh</button></div>

              {!analyticsData?.quizzes?.length ? <div className="analytics-empty"><span>▥</span><h3>No analytics yet</h3><p>Publish a quiz after applying the analytics SQL migration. Student submissions will appear here.</p></div> : <div className="analytics-quiz-list">{analyticsData.quizzes.map((quiz) => <article className="analytics-quiz-row" key={quiz.id}><div className="analytics-quiz-icon">▤</div><div className="analytics-quiz-info"><strong>{quiz.title || "Untitled quiz"}</strong><span>{quiz.attempt_count || 0} attempts · Average {Number(quiz.average_percent || 0).toFixed(1)}%</span><div className="analytics-bar"><span style={{ width: `${Math.max(0, Math.min(100, Number(quiz.average_percent || 0)))}%` }} /></div></div><button className="primary-button" onClick={() => openQuizAnalytics(quiz.id)} disabled={analyticsLoading}>View report →</button></article>)}</div>}

            </>}

          </section>

 

 

 

          <section className="builder-card">

            <div className="builder-section-title">

              <div><h2>My Draft Quizzes</h2><p>Your drafts are saved privately to your teacher account.</p></div>

              <button className="secondary-button" onClick={loadDrafts} disabled={draftsLoading}>{draftsLoading ? "Refreshing…" : "Refresh"}</button>

            </div>

            {draftsLoading ? <p>Loading your drafts…</p> : drafts.length === 0 ? (

              <p>You don't have any cloud drafts yet. Create a quiz and click Save draft.</p>

            ) : (

              <div className="draft-list">

                {drafts.map((draft) => (

                  <article className="builder-card" key={draft.id}>

                    <h3>{draft.title || "Untitled quiz"}</h3>

                    {draft.description && <p>{draft.description}</p>}

                    <p>{draft.questions?.length || 0} questions · {draft.duration} minutes · Updated {draft.updated_at ? new Date(draft.updated_at).toLocaleString() : "recently"}</p>

                    <div className="builder-actions">

                      <button className="primary-button" onClick={() => openDraft(draft)}>Continue editing</button>

                      <button className="secondary-button" onClick={() => deleteDraft(draft.id)}>Delete draft</button>

                    </div>

                  </article>

                ))}

              </div>

            )}

            <button className="primary-button" onClick={openBuilder}>+ Create a quiz</button>

          </section>

 

        </main>

 

      </div>

 

    );

 

  }

 

 

 

  if (page === "quiz-analytics") {

    const report = selectedQuizAnalytics;

    const quiz = report?.quiz || {};

    const attempts = report?.attempts || [];

    const questionsReport = report?.question_stats || [];

    return <div className="builder-page"><header className="builder-navbar"><button className="logo logo-button" onClick={() => goTo("home")}><span className="logo-icon">F</span>FormPilot</button><div className="builder-actions"><button className="secondary-button" onClick={() => { goTo("dashboard"); loadAnalytics(); }}>← Dashboard</button><button className="secondary-button" onClick={downloadQuizCsv} disabled={!attempts.length}>Export CSV ↓</button></div></header><main className="builder-main"><div className="builder-heading"><span className="eyebrow">INDIVIDUAL QUIZ REPORT</span><h1>{quiz.title || "Quiz performance"}</h1><p>Review student results, score patterns, and question difficulty.</p></div>

      <div className="analytics-stat-grid report-stats"><article className="analytics-stat"><span className="analytics-stat-icon">▤</span><span className="analytics-stat-label">Attempts</span><strong>{report?.summary?.attempt_count ?? attempts.length}</strong><small>Recorded submissions</small></article><article className="analytics-stat"><span className="analytics-stat-icon green">◎</span><span className="analytics-stat-label">Average score</span><strong>{Number(report?.summary?.average_percent || 0).toFixed(1)}%</strong><small>Of available marks</small></article><article className="analytics-stat"><span className="analytics-stat-icon orange">★</span><span className="analytics-stat-label">Highest score</span><strong>{Number(report?.summary?.highest_percent || 0).toFixed(1)}%</strong><small>Best recorded attempt</small></article><article className="analytics-stat"><span className="analytics-stat-icon red">!</span><span className="analytics-stat-label">Tab warnings</span><strong>{report?.summary?.tab_warnings ?? 0}</strong><small>Across attempts</small></article></div>

      <section className="builder-card"><div className="analytics-list-heading"><div><h2>Question-wise accuracy</h2><p>Percentage of attempts answering each question correctly.</p></div></div>{!questionsReport.length ? <p>No question data is available yet.</p> : <div className="question-analytics-list">{questionsReport.map((question, index) => <article className="question-analytics-row" key={question.id || index}><div className="question-number">{index + 1}</div><div className="question-analytics-info"><strong>{question.text || `Question ${index + 1}`}</strong><span>{question.correct_count || 0} correct out of {question.attempt_count || 0} responses</span><div className="analytics-bar"><span style={{ width: `${Math.max(0, Math.min(100, Number(question.accuracy_percent || 0)))}%` }} /></div></div><strong className="accuracy-value">{Number(question.accuracy_percent || 0).toFixed(1)}%</strong></article>)}</div>}</section>

      <section className="builder-card"><div className="analytics-list-heading"><div><h2>Student results</h2><p>Student details are collected before each quiz attempt.</p></div><button className="secondary-button" onClick={downloadQuizCsv} disabled={!attempts.length}>Export CSV</button></div>{!attempts.length ? <div className="analytics-empty"><span>◷</span><h3>No student attempts yet</h3><p>Share your quiz link with students. Their completed submissions will appear here.</p></div> : <div className="analytics-table-wrap"><table className="analytics-table"><thead><tr><th>Student</th><th>Register no.</th><th>Score</th><th>Time</th><th>Warnings</th><th>Submission</th></tr></thead><tbody>{attempts.map((attempt) => <tr key={attempt.id}><td><strong>{attempt.student_name || "Student"}</strong><small>{attempt.student_email || ""}</small></td><td>{attempt.register_number || "—"}</td><td><strong>{attempt.score} / {attempt.total_marks}</strong><small>{attempt.total_marks > 0 ? `${(Number(attempt.score) / Number(attempt.total_marks) * 100).toFixed(1)}%` : "—"}</small></td><td>{Math.floor((Number(attempt.duration_seconds) || 0) / 60)}m {(Number(attempt.duration_seconds) || 0) % 60}s</td><td><span className={`warning-pill ${(Number(attempt.tab_warnings) || 0) > 0 ? "has-warnings" : ""}`}>{attempt.tab_warnings || 0}</span></td><td><span className="submission-pill">{String(attempt.submission_reason || "manual").replaceAll("-", " ")}</span><small>{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : ""}</small></td></tr>)}</tbody></table></div>}</section></main></div>;

  }

 

  if (page === "builder") {

 

 

 

    return (

 

 

 

      <div className="builder-page">

 

 

 

        <header className="builder-navbar">

 

 

 

          <button className="logo logo-button" onClick={() => goTo("home")}><span className="logo-icon">F</span>FormPilot</button>

 

 

 

          <span className="draft-status">Quiz editor · Draft</span>

 

 

 

          <div className="builder-actions">

 

 

 

            <button className="secondary-button" onClick={() => goTo("home")}>Home</button>

 

 

 

            <button className="secondary-button" onClick={openDashboard}>Dashboard</button>

 

 

 

            <button className="secondary-button" onClick={saveDraft} disabled={draftSaving}>{draftSaving ? "Saving…" : "Save draft"}</button>

 

 

 

            <button className="secondary-button" onClick={startPreview}>Preview quiz →</button>

 

 

 

            <button className="primary-button" onClick={publishQuiz} disabled={publishing}>{publishing ? "Publishing…" : "Publish quiz ↗"}</button><span className="draft-status">{session?.user?.email || "Teacher account"}</span><button className="secondary-button" onClick={signOut}>Sign out</button>

 

 

 

          </div>

 

 

 

        </header>

 

 

 

        <main className="builder-main">

 

 

 

          <div className="builder-heading"><span className="eyebrow">QUIZ BUILDER</span><h1>Create your assessment</h1><p>Build your questions and configure your quiz settings.</p></div>

 

 

 

          {shareLink && <section className="builder-card"><h2>Quiz published successfully! 🎉</h2><p>Share this link with students:</p><input className="builder-input" readOnly value={shareLink} onFocus={(event) => event.target.select()} /><div className="builder-actions"><button className="primary-button" onClick={copyShareLink}>Copy link</button><button className="secondary-button" onClick={() => window.open(shareLink, "_blank", "noopener,noreferrer")}>Open student link</button></div><small>Links using localhost work only on this computer. Deploy FormPilot online before sharing with other devices.</small></section>}

 

 

 

          {errorMessage && <section className="builder-card"><p role="alert">{errorMessage}</p></section>}

 

 

 

          <section className="builder-card">

 

 

 

            <label htmlFor="builder-title">Quiz title *</label>

 

 

 

            <input id="builder-title" className="builder-input title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Java Programming Quiz" />

 

 

 

            <label htmlFor="builder-description">Description</label>

 

 

 

            <textarea id="builder-description" className="builder-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add instructions for students..." rows={3} />

 

 

 

          </section>

 

 

 

          <section className="builder-card">

 

 

 

            <div className="builder-section-title"><div><span className="eyebrow">CONFIGURATION</span><h2>Quiz settings</h2></div><span className="settings-symbol">⚙</span></div>

 

 

 

            <div className="settings-grid">

 

 

 

              <div className="setting-field"><label htmlFor="duration">Time limit</label><select id="duration" className="builder-input" value={duration} onChange={(event) => setDuration(event.target.value)}>{[1,5,10,15,20,30,45,60,90,120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select><small>The quiz automatically submits when time expires.</small></div>

 

 

 

              <div className="setting-field"><label htmlFor="warning-limit">Tab-switch warning limit</label><select id="warning-limit" className="builder-input" value={warningLimit} onChange={(event) => setWarningLimit(event.target.value)}>{[1,2,3,4,5].map((limit) => <option key={limit} value={limit}>{limit} {limit === 1 ? "warning" : "warnings"}</option>)}</select><small>At the limit, the quiz is submitted automatically.</small></div>

 

 

 

            </div>

 

 

 

            <div className="setting-notice"><span>ⓘ</span> Tab switching is detected when the quiz page becomes hidden. Browser restrictions may affect detection.</div>

 

 

 

          </section>

 

 

 

          <div className="questions-heading"><div><span className="eyebrow">YOUR CONTENT</span><h2>Questions ({questions.length})</h2></div><button className="secondary-button" onClick={addQuestion}>+ Add question</button></div>

 

 

 

          {questions.map((question, questionIndex) => (

 

 

 

            <section className="builder-card question-card" key={question.id}>

 

 

 

              <div className="question-card-heading"><span className="question-number">{String(questionIndex + 1).padStart(2, "0")}</span><strong>Multiple-choice question</strong><button className="delete-question" onClick={() => deleteQuestion(question.id)} disabled={questions.length === 1}>Delete</button></div>

 

 

 

              <label htmlFor={`question-${question.id}`}>Question *</label>

 

 

 

              <textarea id={`question-${question.id}`} className="builder-input" value={question.text} onChange={(event) => updateQuestion(question.id, "text", event.target.value)} placeholder="Type your question here..." rows={2} />

 

 

 

              <div className="options-heading"><label>Answer options *</label><span>Select the circle beside the correct answer.</span></div>

 

 

 

              <div className="builder-options">

 

 

 

                {question.options.map((option, optionIndex) => (

 

 

 

                  <div className="builder-option" key={optionIndex}>

 

 

 

                    <input type="radio" name={`correct-${question.id}`} aria-label={`Mark option ${optionIndex + 1} correct`} checked={question.correctAnswer === optionIndex} onChange={() => updateQuestion(question.id, "correctAnswer", optionIndex)} />

 

 

 

                    <input className="builder-input option-input" value={option} onChange={(event) => updateOption(question.id, optionIndex, event.target.value)} placeholder={`Option ${optionIndex + 1}`} />

 

 

 

                    {question.correctAnswer === optionIndex && <span className="correct-label">Correct</span>}

 

 

 

                    <button type="button" className="remove-option-button" onClick={() => deleteOption(question.id, optionIndex)} disabled={question.options.length <= 2}>×</button>

 

 

 

                  </div>

 

 

 

                ))}

 

 

 

              </div>

 

 

 

              <button type="button" className="add-option-button" onClick={() => addOption(question.id)}>+ Add option</button>

 

 

 

              <div className="marks-field"><label htmlFor={`marks-${question.id}`}>Marks</label><input id={`marks-${question.id}`} className="builder-input marks-input" type="number" min="1" max="100" value={question.marks} onChange={(event) => updateQuestion(question.id, "marks", Math.max(1, Math.min(100, Number(event.target.value) || 1)))} /></div>

 

 

 

            </section>

 

 

 

          ))}

 

 

 

          <button className="add-question-wide" onClick={addQuestion}>+ Add another question</button>

 

 

 

          <div className="builder-footer"><button className="secondary-button" onClick={() => goTo("home")}>← Back to homepage</button><button className="primary-button" onClick={startPreview}>Preview quiz →</button></div>

 

 

 

        </main>

 

 

 

      </div>

 

 

 

    );

 

 

 

  }

 

 

 

 

 

 

 

  if (page === "preview") {

 

 

 

    return (

 

 

 

      <div className="student-preview-page">

 

 

 

        <header className="builder-navbar"><button className="logo logo-button" onClick={() => goTo("builder")}><span className="logo-icon">F</span>FormPilot</button><span className="draft-status">Quiz preview · Teacher view</span><button className="secondary-button" onClick={() => goTo("builder")}>← Edit quiz</button></header>

 

 

 

        <main className="student-preview-main"><section className="student-quiz-card">

 

 

 

          <span className="eyebrow">QUIZ PREVIEW</span><h1>{title}</h1>{description && <p>{description}</p>}

 

 

 

          <div className="preview-meta"><span>◷ {duration} minutes</span><span>{questions.length} questions</span><span>{warningLimit} warnings allowed</span></div>

 

 

 

          <div className="preview-question-progress">Question {previewIndex + 1} of {questions.length}</div>

 

 

 

          <h2>{questions[previewIndex]?.text}</h2>

 

 

 

          {(questions[previewIndex]?.options || []).map((option, index) => <div className="student-answer-option" key={index}><span className="preview-radio">{String.fromCharCode(65 + index)}</span>{option}</div>)}

 

 

 

          <div className="preview-bottom"><button className="secondary-button" disabled={previewIndex === 0} onClick={() => setPreviewIndex((index) => index - 1)}>Previous</button>{previewIndex < questions.length - 1 ? <button className="primary-button" onClick={() => setPreviewIndex((index) => index + 1)}>Next question →</button> : <button className="primary-button" onClick={() => { setPreviewIndex(0); goTo("builder"); }}>Finish preview</button>}</div>

 

 

 

        </section></main>

 

 

 

      </div>

 

 

 

    );

 

 

 

  }

 

 

 

 

 

 

 

  if (page === "student-start") {

 

 

 

    return <div className="student-preview-page"><header className="builder-navbar"><div className="logo"><span className="logo-icon">F</span>FormPilot</div><span className="draft-status">Student quiz</span></header><main className="student-preview-main"><section className="student-quiz-card"><span className="eyebrow">ASSESSMENT</span><h1>{studentQuiz?.title}</h1>{studentQuiz?.description && <p>{studentQuiz.description}</p>}<div className="preview-meta"><span>{studentQuiz?.questions?.length || 0} questions</span><span>◷ {studentQuiz?.duration} minutes</span><span>{studentQuiz?.warning_limit} warnings allowed</span></div><div className="student-identity-form"><h2>Before you begin</h2><p>Enter your details so your teacher can identify your result in the performance report.</p><label htmlFor="student-name">Full name *</label><input id="student-name" className="builder-input" value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Enter your full name" autoComplete="name"/><label htmlFor="student-register">Register number *</label><input id="student-register" className="builder-input" value={studentRegisterNumber} onChange={(event) => setStudentRegisterNumber(event.target.value)} placeholder="Enter your register number"/><label htmlFor="student-email">Email address *</label><input id="student-email" type="email" className="builder-input" value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} placeholder="name@example.com" autoComplete="email"/><p className="identity-privacy-note">Your details are shared with the quiz creator for assessment reporting.</p></div><p>When you start, the timer begins. Leaving the quiz tab may trigger a warning or automatic submission.</p><button className="primary-button" onClick={startQuizAttempt}>Start quiz →</button></section></main></div>;

 

 

 

  }

 

 

 

 

 

 

 

  if (page === "attempt") {

 

 

 

    if (quizSubmitted && finalResult) {

 

 

 

      return <div className="student-preview-page"><main className="student-preview-main"><section className="student-quiz-card result-card"><span className="result-check">✓</span><h1>Quiz submitted!</h1><p>{finalResult.quizTitle}</p><div className="result-score"><strong>{finalResult.score === null ? "Submitted" : `${finalResult.score} / ${finalResult.totalMarks}`}</strong><span>{finalResult.score === null ? "Your submission was received, but automatic grading failed." : "Your score"}</span></div>{finalResult.error && <p role="alert">{finalResult.error}</p>}<p>{finalResult.reason === "time" ? "Your time ran out. Your answers were submitted automatically." : finalResult.reason === "tab-switch" ? "The tab-switch warning limit was reached. Your quiz was submitted automatically." : "Your answers have been submitted."}</p><button className="primary-button" onClick={() => { setStudentQuiz(null); setShareCode(""); window.history.replaceState({}, "", window.location.pathname); goTo("home"); }}>Back to FormPilot</button></section></main></div>;

 

 

 

    }

 

 

 

    const question = activeQuestions[previewIndex];

 

 

 

    if (!question) return <div className="student-preview-page"><main className="student-preview-main"><section className="student-quiz-card"><h1>Quiz has no questions</h1></section></main></div>;

 

 

 

    return <div className="student-preview-page"><header className="builder-navbar"><div className="logo"><span className="logo-icon">F</span>FormPilot</div><div className={`live-timer ${timeLeft <= 60 ? "timer-urgent" : ""}`}><span>◷</span> {formatTime(timeLeft)}</div><span className="draft-status">Quiz in progress · {tabWarnings}/{activeWarningLimit} warnings</span></header><main className="student-preview-main"><section className="student-quiz-card"><span className="eyebrow">ASSESSMENT</span><h1>{activeTitle}</h1>{activeDescription && <p>{activeDescription}</p>}<div className="preview-meta"><span>{activeQuestions.length} questions</span><span>Question {previewIndex + 1} of {activeQuestions.length}</span></div><div className="live-progress-track"><div style={{ width: `${((previewIndex + 1) / activeQuestions.length) * 100}%` }} /></div><h2>{question.text}</h2>{question.options.map((option, index) => <label className={`student-answer-option ${studentAnswers[question.id] === index ? "answer-selected" : ""}`} key={index}><input type="radio" name={`student-${question.id}`} checked={studentAnswers[question.id] === index} onChange={() => chooseAnswer(question.id, index)} /><span className="preview-radio">{String.fromCharCode(65 + index)}</span>{option}</label>)}<div className="preview-bottom"><button className="secondary-button" disabled={previewIndex === 0} onClick={() => setPreviewIndex((index) => index - 1)}>Previous</button>{previewIndex < activeQuestions.length - 1 ? <button className="primary-button" onClick={() => setPreviewIndex((index) => index + 1)}>Next question →</button> : <button className="primary-button" onClick={() => submitQuiz("manual")}>Submit quiz</button>}</div></section></main></div>;

 

 

 

  }

 

 

 

 

 

 

 

  return (

 

 

 

    <div className="app">

 

 

 

      <header className="navbar"><a className="logo" href="#"><span className="logo-icon">F</span>FormPilot</a><nav><a href="#features">Features</a><a href="#how-it-works">How it works</a></nav><div className="builder-actions">{session ? <><span className="draft-status">{session.user?.email}</span><button className="secondary-button" onClick={openDashboard}>Dashboard</button><button className="secondary-button" onClick={signOut}>Sign out</button></> : <button className="secondary-button" onClick={signInWithGoogle} disabled={authLoading}>{authLoading ? "Checking login…" : "Sign in with Google"}</button>}<button className="nav-button" onClick={openBuilder}>Create a quiz <span>↗</span></button></div></header>

 

 

 

      {authError && <section className="builder-card" role="alert"><p>{authError}</p><button className="secondary-button" onClick={() => setAuthError("")}>Dismiss</button></section>}

 

 

 

      <main>

 

 

 

        <section className="hero"><div className="hero-content"><div className="announcement"><span className="live-dot" />A smarter way to conduct quizzes</div><h1>Forms made simple.<br /><span>Quizzes made smarter.</span></h1><p>Create, share, and conduct online quizzes with custom timers, tab-switch warnings, and automatic submission. No student account required.</p><div className="hero-actions"><button className="primary-button" onClick={openBuilder}>Create your first quiz <span>→</span></button><a className="secondary-button" href="#features">Explore features ↓</a></div><div className="hero-note"><span>✓</span> Free to get started <span>✓</span> Shareable quiz links <span>✓</span> Teacher-controlled timer</div></div>

 

 

 

          <div className="preview-area"><div className="preview-glow" /><div className="quiz-preview"><div className="preview-top"><div><span className="preview-label">LIVE PREVIEW</span><h3>Weekly Assessment</h3></div><span className="timer">◷ 14:32</span></div><div className="progress-info"><span>Question 2 of 10</span><span>20% completed</span></div><div className="progress-bar"><div /></div><h4>Which language runs natively in a web browser?</h4><div className="answer-option">○ Python</div><div className="answer-option selected">◉ JavaScript <span>✓</span></div><div className="answer-option">○ C++</div><div className="answer-option">○ Java</div><div className="preview-bottom"><span>Question 2 / 10</span><button>Next question →</button></div></div><div className="floating-card warning-card"><span className="warning-icon">!</span><div><strong>Tab-switch warning</strong><p>Warnings are tracked</p></div></div><div className="floating-card security-card"><span className="security-icon">✓</span><div><strong>Quiz protected</strong><p>Correct answers stay private</p></div></div></div>

 

 

 

        </section>

 

 

 

        <section className="stats"><div><strong>01</strong><span>Create a quiz</span></div><div><strong>02</strong><span>Share a link</span></div><div><strong>03</strong><span>Review results</span></div></section>

 

 

 

        <section className="features-section" id="features"><div className="section-heading"><span className="eyebrow">BUILT FOR BETTER ASSESSMENTS</span><h2>Everything you need, all in one place.</h2><p>Simple for teachers. Easy for students. Smarter for everyone.</p></div><div className="features-grid"><article className="feature-card"><span className="feature-icon purple">◷</span><h3>Custom quiz timer</h3><p>Set the duration for every quiz. Automatically submit when time runs out.</p></article><article className="feature-card"><span className="feature-icon orange">◎</span><h3>Tab-switch warnings</h3><p>Record when the quiz page is hidden and warn students about detected violations.</p></article><article className="feature-card"><span className="feature-icon green">✓</span><h3>Automatic submission</h3><p>Submit after the configured violation limit and lock submitted answers.</p></article><article className="feature-card"><span className="feature-icon blue">↗</span><h3>Easy sharing</h3><p>Share a link. Students do not need to create an account.</p></article><article className="feature-card"><span className="feature-icon pink">▤</span><h3>Instant results</h3><p>Automatically grade objective questions.</p></article><article className="feature-card"><span className="feature-icon yellow">⚙</span><h3>Teacher controls</h3><p>Configure quiz duration, questions, warnings, and marks.</p></article></div></section>

 

 

 

        <section className="how-section" id="how-it-works"><span className="eyebrow">GET STARTED IN MINUTES</span><h2>Your next quiz starts here.</h2><p>Create it, share it, and let FormPilot handle the rest.</p><button className="primary-button" onClick={openBuilder}>Start creating <span>→</span></button></section>

 

 

 

      </main>

 

 

 

      <footer><a className="logo" href="#"><span className="logo-icon">F</span>FormPilot</a><span>Smarter assessments start here.</span></footer>

 

 

 

    </div>

 

 

 

  );

 

 

 

}

 

 

 

 

 

 

 

export default App;