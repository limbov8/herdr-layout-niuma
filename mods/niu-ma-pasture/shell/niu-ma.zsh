# NiuMa pasture shell integration. Records each command on this Herdr terminal as labels,
# so the pasture's pot / fire pit / crystal can show it:
#   niu-ma.state  running | done
#   niu-ma.cmd    the command line (first 300 characters)
#   niu-ma.start  when it started, ms since the epoch
#   niu-ma.exit   its exit status (when done)
#   niu-ma.end    when it finished, ms since the epoch
# Loaded from ~/.zshrc; does nothing outside a Herdr terminal. `hc label` runs in the
# background so the prompt never waits for it.
[[ -n $HC_TERMINAL_ID && -o interactive ]] || return 0
command -v hc >/dev/null 2>&1 || return 0
zmodload zsh/datetime 2>/dev/null
autoload -Uz add-zsh-hook

typeset -g _niu_ma_running=0

_niu_ma_ms() { print -r -- $(( ${EPOCHREALTIME%.*} * 1000 + ${${EPOCHREALTIME#*.}[1,3]} )) }

_niu_ma_preexec() {
  _niu_ma_running=1
  local cmd=${1//$'\n'/ }
  hc label "$HC_TERMINAL_ID" niu-ma.state=running "niu-ma.cmd=${cmd[1,300]}" "niu-ma.start=$(_niu_ma_ms)" \
    niu-ma.exit= niu-ma.end= >/dev/null 2>&1 &!
}

_niu_ma_precmd() {
  local code=$?
  (( _niu_ma_running )) || return 0
  _niu_ma_running=0
  hc label "$HC_TERMINAL_ID" niu-ma.state=done "niu-ma.exit=$code" "niu-ma.end=$(_niu_ma_ms)" >/dev/null 2>&1 &!
}

add-zsh-hook preexec _niu_ma_preexec
add-zsh-hook precmd _niu_ma_precmd
