{{- define "pc-components.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- define "pc-components.fullname" -}}
{{- if .Values.fullnameOverride }}{{ .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}{{- else }}{{ printf "%s-%s" .Release.Name (include "pc-components.name" .) | trunc 63 | trimSuffix "-" }}{{- end }}
{{- end }}
{{- define "pc-components.labels" -}}
app.kubernetes.io/name: {{ include "pc-components.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end }}
{{- define "pc-components.selectorLabels" -}}
app.kubernetes.io/name: {{ include "pc-components.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
