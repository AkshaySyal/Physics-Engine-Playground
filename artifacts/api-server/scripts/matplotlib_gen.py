#!/usr/bin/env python3
"""
Matplotlib visualization generator.
Reads JSON from stdin: { "query": "...", "intent": {...}, "generatedCode": "..." }
If generatedCode is present, executes it to get a `fig` variable.
Falls back to hardcoded plots if execution fails or no code provided.
Outputs JSON to stdout: { "imageBase64": "..." }
"""

import sys
import json
import io
import base64
import math
import traceback

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    import numpy as np
except ImportError as e:
    print(json.dumps({"error": f"Import error: {str(e)}"}))
    sys.exit(1)

def set_dark_style():
    plt.rcParams.update({
        'figure.facecolor': '#0f172a',
        'axes.facecolor': '#1e293b',
        'axes.edgecolor': '#475569',
        'axes.labelcolor': '#e2e8f0',
        'axes.titlecolor': '#f1f5f9',
        'xtick.color': '#94a3b8',
        'ytick.color': '#94a3b8',
        'grid.color': '#334155',
        'grid.alpha': 0.5,
        'text.color': '#e2e8f0',
        'legend.facecolor': '#1e293b',
        'legend.edgecolor': '#475569',
        'legend.labelcolor': '#e2e8f0',
        'figure.figsize': (8, 5),
        'figure.dpi': 100,
    })

def execute_generated_code(code):
    """Execute LLM-generated matplotlib code and return the fig object."""
    namespace = {
        'matplotlib': matplotlib,
        'plt': plt,
        'mpatches': mpatches,
        'np': np,
        'math': math,
        'io': io,
        'base64': base64,
    }
    set_dark_style()
    exec(code, namespace)
    fig = namespace.get('fig')
    if fig is None:
        raise ValueError("Generated code did not produce a variable named 'fig'")
    return fig

# ── Fallback static plots ────────────────────────────────────────────────────

def plot_kinematics(query):
    set_dark_style()
    fig, axes = plt.subplots(1, 3, figsize=(12, 4))
    fig.suptitle('Kinematics: Position, Velocity, Acceleration vs Time', color='#f1f5f9', fontsize=13, y=1.02)
    t = np.linspace(0, 5, 200)
    a0, v0, x0 = 2.0, 1.0, 0.0
    x = x0 + v0 * t + 0.5 * a0 * t**2
    v = v0 + a0 * t
    a = np.full_like(t, a0)
    colors = ['#38bdf8', '#34d399', '#fb923c']
    labels = ['x(t) [m]', 'v(t) [m/s]', 'a(t) [m/s²]']
    data = [x, v, a]
    ylabels = ['Position (m)', 'Velocity (m/s)', 'Acceleration (m/s²)']
    for i, ax in enumerate(axes):
        ax.plot(t, data[i], color=colors[i], linewidth=2)
        ax.set_xlabel('Time (s)')
        ax.set_ylabel(ylabels[i])
        ax.set_title(labels[i])
        ax.grid(True, alpha=0.3)
    plt.tight_layout()
    return fig

def plot_wave(query):
    set_dark_style()
    fig, axes = plt.subplots(2, 1, figsize=(9, 6))
    fig.suptitle('Wave Superposition', color='#f1f5f9', fontsize=13)
    x = np.linspace(0, 4 * np.pi, 500)
    A1, lam1 = 1.0, 2 * np.pi
    y1 = A1 * np.sin(2 * np.pi / lam1 * x)
    A2, lam2 = 0.8, np.pi
    y2 = A2 * np.sin(2 * np.pi / lam2 * x)
    axes[0].plot(x, y1, color='#38bdf8', linewidth=2, label='Wave 1')
    axes[0].plot(x, y2, color='#fb923c', linewidth=2, label='Wave 2')
    axes[0].axhline(0, color='#475569', linewidth=0.8)
    axes[0].set_ylabel('Amplitude')
    axes[0].set_title('Input Waves')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    axes[1].plot(x, y1 + y2, color='#a78bfa', linewidth=2, label='Superposition')
    axes[1].axhline(0, color='#475569', linewidth=0.8)
    axes[1].set_xlabel('Position')
    axes[1].set_ylabel('Amplitude')
    axes[1].set_title('Resultant Wave')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    plt.tight_layout()
    return fig

def plot_default(query):
    set_dark_style()
    fig, ax = plt.subplots(figsize=(8, 5))
    t = np.linspace(0, 2 * np.pi, 300)
    ax.plot(t, np.sin(t), color='#38bdf8', linewidth=2, label='sin(t)')
    ax.plot(t, np.cos(t), color='#fb923c', linewidth=2, linestyle='--', label='cos(t)')
    ax.axhline(0, color='#475569', linewidth=0.8)
    ax.set_xlabel('t')
    ax.set_ylabel('Amplitude')
    ax.set_title('Physics Visualization')
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    return fig

PLOT_MAP = {
    'kinematics': plot_kinematics,
    'kinematics_plot': plot_kinematics,
    'wave': plot_wave,
    'wave_plot': plot_wave,
}

def fig_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')

def main():
    raw = sys.stdin.read()
    payload = json.loads(raw)
    query = payload.get('query', '')
    intent = payload.get('intent', {})
    generated_code = payload.get('generatedCode')

    visual_type = intent.get('visual_type', '').lower().replace(' ', '_').replace('-', '_')
    query_intent = intent.get('query_intent', '').lower().replace(' ', '_').replace('-', '_')

    # Try generated code first
    if generated_code:
        try:
            fig = execute_generated_code(generated_code)
            b64 = fig_to_base64(fig)
            print(json.dumps({'imageBase64': b64}))
            return
        except Exception as e:
            sys.stderr.write(f"Generated code failed: {e}\n{traceback.format_exc()}\n")
            # Fall through to static fallback

    # Static fallback
    plot_fn = None
    for key in [visual_type, query_intent]:
        for map_key, fn in PLOT_MAP.items():
            if map_key in key or key in map_key:
                plot_fn = fn
                break
        if plot_fn:
            break

    if not plot_fn:
        plot_fn = plot_default

    fig = plot_fn(query)
    b64 = fig_to_base64(fig)
    print(json.dumps({'imageBase64': b64}))

if __name__ == '__main__':
    main()
