# Лабораторна робота №4 — PC Components + Kubernetes + Helm

Навчальний повноцінний приклад для вимог методички: React SPA, FastAPI REST API, PostgreSQL, SQLAlchemy ORM, Alembic migration job, Docker, Helm Chart і GitHub Actions.

## Архітектура

- **Frontend:** React + Vite; перегляд, створення, редагування й видалення комплектуючих.
- **Backend:** FastAPI; CRUD API під `/api/items`, документація `/docs`, перевірка `/health`.
- **Database:** PostgreSQL 16; дані зберігаються у volume/PersistentVolume.
- **Migration job:** окремий Docker image, який запускає `alembic upgrade head`.
- **Helm:** StatefulSet + PVC для PostgreSQL, Deployment/Service для API та frontend, Job для міграції, optional Ingress.
- **CI:** перевіряє Python, збирає frontend, виконує `helm lint`/`helm template`, пакує chart і завантажує `.tgz` як workflow artifact. На push у main/master також публікує три Docker images у GHCR.

## 1. Запуск локально через Docker Desktop

Потрібні Docker Desktop і Git. Відкрийте термінал у корені репозиторію.

```bash
docker compose up --build
```

Після успішного старту відкрийте:

- Frontend: <http://localhost:8080>
- API docs: <http://localhost:8000/docs>
- API health: <http://localhost:8000/api/health>

Compose спершу чекає готовності PostgreSQL, потім запускає окремий контейнер міграцій, і лише після успішного завершення міграцій запускає API. Додавані записи зберігаються в Docker volume `postgres_data`.

Зупинити: `Ctrl+C`, потім `docker compose down`. Щоб також видалити локальні дані БД: `docker compose down -v` (не робіть цього, якщо потрібно зберегти записи).

## 2. Додати код у власний GitHub-репозиторій

Якщо репозиторій на GitHub уже створено, скопіюйте в нього вміст цього каталогу. Якщо в каталозі ще немає Git-історії, виконайте в корені проєкту:

```bash
git init
git add .
git commit -m "Complete lab 4: frontend, database, Helm and CI"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Заміни URL на адресу саме свого репозиторію. Якщо `origin` вже налаштований, не додавай його вдруге: перевір `git remote -v`, а потім виконай `git push -u origin main`. Якщо репозиторій має README/коміти на GitHub, спочатку узгодь історії або клонувати репозиторій і скопіюй файли в нього.

## 3. GitHub Actions і Docker Registry

Workflow лежить у `.github/workflows/ci.yml`. Після push у `main` або `master` GitHub Actions збирає frontend і перевіряє Helm Chart. Chart буде доступний на вкладці **Actions → успішний запуск → Artifacts → pc-components-helm-chart**. Також workflow публікує образи в GitHub Container Registry (GHCR):

- `ghcr.io/YOUR-USERNAME/pc-components-api`
- `ghcr.io/YOUR-USERNAME/pc-components-migrate`
- `ghcr.io/YOUR-USERNAME/pc-components-frontend`

Для `GITHUB_TOKEN` окремий секрет не потрібен: workflow має `packages: write`. У налаштуваннях репозиторію перевір **Settings → Actions → General → Workflow permissions**, якщо організаційні політики обмежують права. Зроби package images доступними для завантаження з кластера; для приватних образів створи Kubernetes imagePullSecret.

> Важливо: значення `CHANGE_ME` у `k8s/values.yaml` є шаблонним. Перед розгортанням заміни `YOUR-USERNAME` на свій GitHub username у трьох `repository`. Ім'я має бути в нижньому регістрі.

## 4. Перевірка Helm Chart локально

Потрібні Helm 3 і доступ до Kubernetes потрібен лише для фактичного встановлення; lint/render виконуються локально.

```bash
helm version
helm lint k8s
helm template lab k8s -n webapp-lab --create-namespace
mkdir -p dist
helm package k8s --destination dist
```

Архів з'явиться в `dist/pc-components-0.1.0.tgz`. Пакування Helm Chart не потребує запущеного Kubernetes-кластера.

## 5. Розгортання в Kubernetes

Спочатку переконайтеся, що кластер працює: `kubectl get nodes`. Для локального навчального запуску можна використати Docker Desktop Kubernetes або minikube. Для Ingress потрібен встановлений Ingress Controller; один лише ресурс Ingress контролер не встановлює.

1. Відредагуйте `k8s/values.yaml`: замініть `CHANGE_ME` у шляхах образів, задайте свій пароль БД і, якщо потрібно, `ingress.enabled: true`. Не використовуйте пароль з прикладу для реальних середовищ.
2. Встановіть release:

```bash
helm upgrade --install lab k8s \
  --namespace webapp-lab --create-namespace \
  --set api.image.tag=latest \
  --set migration.image.tag=latest \
  --set frontend.image.tag=latest \
  --wait --wait-for-jobs --timeout 5m
```

Перевірте стан:

```bash
helm status lab -n webapp-lab
kubectl get pods,svc,pvc,job -n webapp-lab
kubectl logs -n webapp-lab job/lab-pc-components-migration-1
```

Ім'я migration Job включає номер ревізії Helm; якщо це не перша ревізія, подивіться точне ім'я через `kubectl get jobs -n webapp-lab`.

Для локального доступу без Ingress, виконайте у двох окремих терміналах:

```bash
kubectl port-forward -n webapp-lab svc/lab-pc-components-frontend 8080:80
```

```bash
kubectl port-forward -n webapp-lab svc/pc-components-api 8000:8000
```

Frontend проксуює `/api` до API за внутрішнім DNS-іменем сервісу `pc-components-api`.

Для Ingress задайте `ingress.enabled: true`, `ingress.className: nginx`, `ingress.host: webapp.lab.test`, а також налаштуйте DNS/hosts на адресу контролера. Ingress маршрутизує `/api` до API та `/` до frontend.

## 6. Корисні команди

```bash
kubectl get all -n webapp-lab
kubectl describe pod -n webapp-lab <POD_NAME>
kubectl logs -n webapp-lab deployment/lab-pc-components-api
helm history lab -n webapp-lab
helm rollback lab 1 -n webapp-lab
helm uninstall lab -n webapp-lab
```

Видалення Helm release не завжди видаляє PVC StatefulSet, тому для очищення тестового середовища окремо перевір `kubectl get pvc -n webapp-lab`.

## 7. Основні endpoints

| Метод | Endpoint | Призначення |
|---|---|---|
| GET | `/api/items` | список компонентів |
| GET | `/api/items/{id}` | один компонент |
| POST | `/api/items` | створення |
| PUT | `/api/items/{id}` | редагування |
| DELETE | `/api/items/{id}` | видалення |
| GET | `/api/health` | API + DB health check |
| GET | `/docs` | Swagger UI |

## Примітки

- Це навчальний шаблон. Перед публічним/production розгортанням винесіть пароль БД у Kubernetes Secret, створений окремо або через менеджер секретів; не комітьте реальні секрети в Git.
- Вказаний у Dockerfile Python 3.12 використовується всередині образу; для запуску через Docker не потрібно встановлювати Python 3.12 локально.
- Застосунок має стартові міграції, але не містить тестових записів: додайте компоненти через UI.
