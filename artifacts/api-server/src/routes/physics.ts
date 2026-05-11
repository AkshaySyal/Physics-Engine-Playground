import { Router, type IRouter } from "express";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ai } from "@workspace/integrations-gemini-ai";
import { generateImage } from "@workspace/integrations-gemini-ai/image";
import {
  ClassifyQueryBody,
  GenerateQuestionBody,
  VisualizeMatplotlibBody,
  VisualizeRechartsBody,
  VisualizeD3Body,
  VisualizeManimBody,
  VisualizeGoogleImageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Suitability map ───────────────────────────────────────────────────────────
const MATPLOTLIB_SUITABLE = new Set([
  "kinematics", "motion_graph", "position_time", "velocity_time",
  "trajectory", "projectile", "wave", "wave_plot", "oscillation", "shm",
  "energy", "energy_conservation", "circular_motion", "rotation",
  "parameter_comparison", "comparison",
]);

const RECHARTS_SUITABLE = new Set([
  "kinematics", "motion_graph", "position_time", "velocity_time",
  "trajectory", "projectile", "wave", "wave_plot", "oscillation", "shm",
  "energy", "energy_conservation", "parameter_comparison", "comparison",
]);

const D3_SUITABLE = new Set([
  "free_body", "force_balance", "vector", "vector_decomposition",
  "circular_motion", "rotation", "angular_momentum", "torque",
  "kinematics", "motion_graph", "wave", "wave_plot", "oscillation", "shm",
  "trajectory", "projectile", "diagram_annotation", "annotation", "parameter_comparison",
]);

const MANIM_SUITABLE = new Set([
  "circular_motion", "rotation", "oscillation", "shm",
  "trajectory", "projectile", "wave", "wave_plot",
  "free_body", "force_balance", "vector", "vector_decomposition",
  "kinematics", "motion_graph",
]);


function normalizeIntent(s: string) {
  return s.toLowerCase().replace(/[\s\-]/g, "_");
}

function isSuitable(intent: string, set: Set<string>): boolean {
  const n = normalizeIntent(intent);
  for (const key of set) {
    if (n.includes(key) || key.includes(n)) return true;
  }
  return false;
}

// ─── Gemini helper ─────────────────────────────────────────────────────────────
async function geminiJson<T>(prompt: string, systemPrompt: string, imageContext?: string | null): Promise<T> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];
  if (imageContext) {
    const base64 = imageContext.includes(",") ? imageContext.split(",")[1] : imageContext;
    parts.push({ inlineData: { mimeType: "image/png", data: base64 } });
  }
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });
  const text = response.text ?? "{}";
  return JSON.parse(text) as T;
}

async function geminiText(prompt: string, systemPrompt: string, imageContext?: string | null): Promise<string> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];
  if (imageContext) {
    const base64 = imageContext.includes(",") ? imageContext.split(",")[1] : imageContext;
    parts.push({ inlineData: { mimeType: "image/png", data: base64 } });
  }
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 8192,
    },
  });
  return response.text ?? "";
}

// ─── Classify ─────────────────────────────────────────────────────────────────
router.post("/classify", async (req, res) => {
  const parsed = ClassifyQueryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { query, imageContext } = parsed.data;

  const systemPrompt = `You are a physics visualization classifier. Given a physics query (and optionally an image of a graph or diagram), classify it and return a JSON object with these fields:
- query_intent: one of: free_body, vector_decomposition, kinematics, trajectory, circular_motion, energy, oscillation, wave, diagram_annotation, parameter_comparison
- physics_concept: the main physics concept (short string)
- visual_type: the best visual type (e.g. "free_body_diagram", "kinematics_plot", "wave_plot", "trajectory_plot", "energy_bar_chart", "vector_diagram", "circular_motion_diagram", "oscillation_plot", "annotated_diagram", "comparison_plot")
- recommended_frameworks: array of framework identifiers from: ["matplotlib", "recharts", "d3", "manim", "google_image"] — pick 2-4 that best fit
- requires_animation: boolean
- requires_numeric_data: boolean
If an image is provided, analyze it to understand the graph or diagram and incorporate it into the classification.
Return only valid JSON, no markdown.`;

  try {
    type IntentShape = {
      query_intent: string;
      physics_concept: string;
      visual_type: string;
      recommended_frameworks: string[];
      requires_animation: boolean;
      requires_numeric_data: boolean;
    };

    let intent: IntentShape;

    if (imageContext) {
      const base64 = imageContext.includes(",") ? imageContext.split(",")[1] : imageContext;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{
          role: "user",
          parts: [
            { text: query },
            { inlineData: { mimeType: "image/png", data: base64 } },
          ],
        }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
        },
      });
      intent = JSON.parse(response.text ?? "{}") as IntentShape;
    } else {
      intent = await geminiJson<IntentShape>(query, systemPrompt);
    }

    res.json(intent);
  } catch (err) {
    console.error("Classify error:", err);
    res.status(500).json({ error: "Classification failed" });
  }
});

// ─── Generate Question ────────────────────────────────────────────────────────
router.post("/generate-question", async (req, res) => {
  const parsed = GenerateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { categoryId, exampleQuestion } = parsed.data;

  const systemPrompt = `You are a physics education assistant. Your task is to paraphrase a given physics question by:
- Keeping the same physics concept and question structure
- Changing numerical values (angles, masses, velocities, distances, spring constants, etc.) to different realistic values
- Slightly varying the physical scenario (different object, different context) while keeping the same concept
- Keeping the same difficulty level and conciseness (1-2 sentences)
Return only the new question text, no explanation or preamble.`;

  const prompt = exampleQuestion
    ? `Original question: "${exampleQuestion}"\nParaphrase this question by changing the values and slightly varying the scenario, while keeping the same physics concept.`
    : `Category: ${categoryId}\nGenerate a new physics question suitable for visualization (plot, diagram, or animation) in 1-2 sentences.`;

  try {
    const question = await geminiText(prompt, systemPrompt);
    res.json({ question: question.trim() });
  } catch (err) {
    console.error("Generate question error:", err);
    res.status(500).json({ error: "Question generation failed" });
  }
});

// ─── Matplotlib ───────────────────────────────────────────────────────────────
router.post("/visualize/matplotlib", async (req, res) => {
  const parsed = VisualizeMatplotlibBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { query, intent, imageContext } = parsed.data;

  if (!isSuitable(intent.query_intent, MATPLOTLIB_SUITABLE)) {
    res.json({
      imageBase64: null,
      suitable: false,
      note: "Matplotlib is not ideal for this visualization type. Best for plots and graphs.",
      renderTimeMs: null,
    });
    return;
  }

  const scriptPath = path.resolve(__dirname, "scripts", "matplotlib_gen.py");
  const start = Date.now();

  // Generate query-specific matplotlib code via Gemini
  const codePrompt = `Generate Python matplotlib code to visualize this physics problem.

Query: ${query}
Visual type: ${intent.visual_type}
Physics concept: ${intent.physics_concept}
Requires animation: ${intent.requires_animation}
Requires numeric data: ${intent.requires_numeric_data}
${imageContext ? "An image of the original question/graph is attached as context — match its content exactly." : ""}

Rules:
- Imports are already available: matplotlib, matplotlib.pyplot as plt, matplotlib.patches as mpatches, numpy as np, math, io, base64
- Create the final figure in a variable named exactly \`fig\`
- Apply this dark theme to rcParams before creating the figure:
  figure.facecolor=#0f172a, axes.facecolor=#1e293b, axes.edgecolor=#475569,
  axes.labelcolor=#e2e8f0, axes.titlecolor=#f1f5f9, xtick.color=#94a3b8,
  ytick.color=#94a3b8, grid.color=#334155, grid.alpha=0.5, text.color=#e2e8f0,
  legend.facecolor=#1e293b, legend.edgecolor=#475569
- Use colors: #38bdf8 (blue), #34d399 (green), #fb923c (orange), #a78bfa (purple), #f472b6 (pink)
- Label all axes, add a descriptive title, add a legend if multiple series
- Be SPECIFIC to this exact query: use the graph shape, values, or scenario described, not a generic example
- Do NOT call plt.show(), plt.savefig(), or plt.close()
- Return ONLY executable Python code — no markdown, no code fences, no explanation`;

  let generatedCode: string | null = null;
  try {
    generatedCode = await geminiText(codePrompt, "You are a Python matplotlib expert. Output only raw executable Python code.", imageContext);
    // Strip any accidental markdown fences
    generatedCode = generatedCode.replace(/^```python\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  } catch (codeErr) {
    console.error("Matplotlib code generation error:", codeErr);
  }

  const payload = JSON.stringify({ query, intent, imageContext: imageContext ?? null, generatedCode });

  try {
    const result = await new Promise<string>((resolve, reject) => {
      const python3 = process.env.PYTHON3_PATH ?? "/home/runner/workspace/.pythonlibs/bin/python3";
      const proc = spawn(python3, [scriptPath], {
        timeout: 30000,
        env: {
          ...process.env,
          PYTHONPATH: "/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages",
          MPLBACKEND: "Agg",
        },
      });
      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
      proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
      proc.on("close", (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(`Python exited ${code}: ${stderr}`));
      });
      proc.on("error", reject);
      proc.stdin.write(payload);
      proc.stdin.end();
    });

    const parsed2 = JSON.parse(result);
    const renderTimeMs = Date.now() - start;
    res.json({
      imageBase64: parsed2.imageBase64 ?? null,
      suitable: true,
      note: "Generated with Matplotlib (Python backend)",
      renderTimeMs,
    });
  } catch (err) {
    console.error("Matplotlib error:", err);
    res.json({
      imageBase64: null,
      suitable: true,
      note: `Matplotlib rendering failed: ${err instanceof Error ? err.message : String(err)}`,
      renderTimeMs: null,
    });
  }
});

// ─── Recharts ─────────────────────────────────────────────────────────────────
router.post("/visualize/recharts", async (req, res) => {
  const parsed = VisualizeRechartsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { query, intent, imageContext } = parsed.data;

  if (!isSuitable(intent.query_intent, RECHARTS_SUITABLE)) {
    res.json({
      suitable: false,
      note: "Recharts is not ideal for this visualization type. Best for interactive charts and plots.",
    });
    return;
  }

  const systemPrompt = `You are a physics data generator for Recharts charts. Given a physics query, generate chart data and configuration. Return JSON:
{
  "chartType": "line" | "bar" | "area",
  "data": [{ "t": 0, "x": 0, "v": 0 }],  // array of data points, keys must be short strings
  "xKey": "t",  // key for x-axis
  "yKeys": ["x", "v"],  // keys for y-axis series
  "colors": ["#38bdf8", "#fb923c"],  // hex colors, one per yKey
  "xLabel": "Time (s)",
  "yLabel": "Value",
  "title": "Chart Title"
}
Rules:
- Use 50-100 data points for smooth curves
- Keep all numeric values realistic physics values
- For kinematics: use time as xKey, position/velocity/acceleration as yKeys
- For wave: use position as xKey, displacement as yKey
- For energy: use time or position as xKey
- Return ONLY valid JSON, no markdown`;

  try {
    const data = await geminiJson<{
      chartType: string;
      data: Array<Record<string, number>>;
      xKey: string;
      yKeys: string[];
      colors: string[];
      xLabel: string;
      yLabel: string;
      title: string;
    }>(query, systemPrompt, imageContext);

    res.json({
      ...data,
      suitable: true,
      note: "Interactive chart generated with Recharts",
    });
  } catch (err) {
    console.error("Recharts error:", err);
    res.json({
      suitable: false,
      note: `Recharts data generation failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});

// ─── SVG sanitizer ─────────────────────────────────────────────────────────────
function sanitizeSvg(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/href\s*=\s*"javascript:[^"]*"/gi, "")
    .replace(/xlink:href\s*=\s*"javascript:[^"]*"/gi, "")
    .replace(/<!ENTITY[\s\S]*?>/gi, "")
    .replace(/<\?[\s\S]*?\?>/g, "");
}

// ─── D3 ───────────────────────────────────────────────────────────────────────
router.post("/visualize/d3", async (req, res) => {
  const parsed = VisualizeD3Body.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { query, intent, imageContext } = parsed.data;

  if (!isSuitable(intent.query_intent, D3_SUITABLE)) {
    res.json({
      svgContent: null,
      diagramType: null,
      suitable: false,
      note: "D3.js is not ideal for this visualization type. Best for diagrams and structural charts.",
    });
    return;
  }

  const systemPrompt = `You are a physics SVG diagram generator. Generate clean, educational SVG diagrams for physics concepts. 
The SVG should:
- Use width="500" height="400" viewBox="0 0 500 400"
- Use dark background rect fill="#1e293b"
- Use clear colors: arrows in #38bdf8 (blue), labels in #f1f5f9, accent colors #fb923c #34d399 #a78bfa
- Include labeled force arrows, vectors, or physics elements
- Use <text> elements for labels
- Use <line> or <path> with marker-end for arrows
- Be clean, minimal, and educational
- Do NOT include <script> tags, event handlers, or external references
For free-body diagrams: draw a box/object with force arrows (up=normal, down=weight, right=applied, left=friction)
For vector diagrams: draw a coordinate system with vectors
For wave diagrams: draw a sinusoidal wave with labeled amplitude and wavelength
For circular motion: draw a circle with velocity tangent and centripetal arrows
For kinematics: draw a timeline with position/velocity arrows
Return ONLY the complete SVG markup starting with <svg, no markdown, no explanation.`;

  try {
    const svgRaw = await geminiText(query, systemPrompt, imageContext);
    const stripped = svgRaw.trim().replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "");
    const cleaned = sanitizeSvg(stripped);
    res.json({
      svgContent: cleaned,
      diagramType: intent.visual_type,
      suitable: true,
      note: "SVG diagram generated with D3-compatible markup",
    });
  } catch (err) {
    console.error("D3 error:", err);
    res.json({
      svgContent: null,
      diagramType: null,
      suitable: false,
      note: `D3 diagram generation failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});

// ─── Manim ────────────────────────────────────────────────────────────────────
router.post("/visualize/manim", async (req, res) => {
  const parsed = VisualizeManimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { query, intent, imageContext } = parsed.data;

  if (!isSuitable(intent.query_intent, MANIM_SUITABLE)) {
    res.json({
      script: null,
      sceneClass: null,
      animatedSvg: null,
      suitable: false,
      note: "Manim is not ideal for this visualization type. Best for animated physics scenes.",
    });
    return;
  }

  const scriptPrompt = `You are a Manim animation script generator for physics education. Generate a complete, runnable Manim Python script for the given physics query.
Requirements:
- Import from manim: from manim import *
- Create a Scene class with a descriptive name
- Use realistic physics values and labels
- Include smooth animations (Create, Transform, FadeIn, GrowArrow, etc.)
- Add text labels and mathematical notation
- Keep the scene under 30 seconds
- Use dark background (default in Manim)
- Comment key animation steps
Return ONLY the Python script, no markdown or explanation.`;

  const svgPrompt = `You are a physics animation SVG generator for educational use.
Create a browser-renderable SVG with CSS and SMIL animations visually showing the physics concept described.
Requirements:
- SVG: width="500" height="400" viewBox="0 0 500 400"
- Dark background: <rect width="500" height="400" fill="#0f172a"/>
- Use <style> with @keyframes for smooth CSS animations (animation-iteration-count: infinite)
- Use SMIL <animate>, <animateTransform>, <animateMotion> for additional motion
- Colors: moving objects in #38bdf8, force/acceleration arrows in #fb923c, labels in #f1f5f9, secondary in #34d399
- Show the KEY physics motion clearly: if trajectory, show a projectile arc with a moving dot; if oscillation, show a spring/pendulum swinging; if wave, show propagating sinusoidal wave; if circular motion, show an orbiting body; if free-body, show force arrows; if kinematics, animate a moving object with labeled axes
- Include axis labels, key values, and a title as <text> elements
- All animations must loop indefinitely
- NO JavaScript — only CSS and SMIL animations
Return ONLY the complete SVG markup starting with <svg. No markdown, no explanation.`;

  try {
    const [scriptRaw, svgRaw] = await Promise.all([
      geminiText(query, scriptPrompt, imageContext),
      geminiText(query, svgPrompt, imageContext),
    ]);

    const cleaned = scriptRaw.trim().replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "");
    const classMatch = cleaned.match(/class\s+(\w+)\s*\(Scene\)/);
    const sceneClass = classMatch ? classMatch[1] : "PhysicsScene";

    const svgStripped = svgRaw.trim().replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "");
    const animatedSvg = sanitizeSvg(svgStripped);

    res.json({
      script: cleaned,
      sceneClass,
      animatedSvg,
      suitable: true,
      note: "Manim script generated — render with: manim -pql script.py " + sceneClass,
    });
  } catch (err) {
    console.error("Manim error:", err);
    res.json({
      script: null,
      sceneClass: null,
      animatedSvg: null,
      suitable: false,
      note: `Manim script generation failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});

// ─── Google Image ─────────────────────────────────────────────────────────────
router.post("/visualize/google-image", async (req, res) => {
  const parsed = VisualizeGoogleImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { query, intent, imageContext: _imageContext } = parsed.data;

  const imagePrompt = `Create a clean, textbook-style physics diagram for: "${query}".
Physics concept: ${intent.physics_concept}
Visual type: ${intent.visual_type}
Style requirements:
- Clean educational physics diagram style
- White or light gray background
- Clear labeled arrows showing forces, vectors, or motion
- Correct physics notation and symbols
- Minimal text, only essential labels
- High contrast, publication quality
- No decorative elements, purely educational`;

  try {
    const { b64_json, mimeType } = await generateImage(imagePrompt);
    res.json({
      imageBase64: b64_json,
      mimeType,
      suitable: true,
      note: "Generated with Gemini AI image generation",
    });
  } catch (err) {
    console.error("Google image error:", err);
    res.json({
      imageBase64: null,
      mimeType: null,
      suitable: false,
      note: `Image generation failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});

export default router;
