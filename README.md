# Hyperspace Management Platform Frontend

This repository contains the frontend component of a hyperspace management system. Built with `NextJS`.

For the backend application, see: [platform-api](https://github.com/hscowork/platform-backend-private)

## Table of Contents

[Getting started](#getting-started)  
[Configuration](#configuration)  
[Generators](#generators)  
[Docker](#docker)  
[Deployment](#deployment)  


## Getting Started

Before starting the project, please make sure that you have a valide supabase accout and you already started the [backend](https://github.com/hscowork/platform-backend-private) or you have access to [render](https://platform-api-5wk6.onrender.com/).

1. Install dependecies:
```bash
npm install
```

2. Set up environment variables
```bash
cp .env.example .env
```

Edit the .env file with your [configuration](#configuration) (see Configuration section)

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration 
The main configuration file is `.env`, Here are the key variables:
```sh
NEXT_PUBLIC_SUPABASE_URL=https://project-id.supabase.co/
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=supbase-publishable-key
HS_API_BASE_URL=http://localhost:8080
```

## Generators
### Generate the HS service from swagger file
- Start the backend service or you can use the hosted one on [render](https://platform-api-5wk6.onrender.com/)
- Create swagger file `swagger.json` on root project and copy the content from the path `_docs/json` using the backend service (e.g. http://localhost:8080/_docs/json), or the hosted on [render](https://platform-api-5wk6.onrender.com/_docs/json).
- run the service generation using `npm run generate`, you can see the results on [service](./lib/service/) folder under `lib`.

## Docker

To test our application on Docker, First you need to build docker image by running the following:
```bash
 docker build --build-arg SUPABASE_URL=<SUPBASE_PROJECT_URL> --build-arg SUPABASE_PUBLISHABLE_OR_ANON_KEY=<PUBLISHABLE_API_KEY> -t frontend . -f deploy/docker/Dockerfile
```

Afterwards, you can start the Docker container with:
```bash 
docker run -e API_HS_BASE_URL=<BACKEND_URL>  -p 3000:3000 frontend:latest

# Example
docker run -e API_HS_BASE_URL=http://localhost:8080  -p 3000:3000 frontend:latest
```

## Deployment
Our CD pipeline will automatically deploy to different cloud providers based on the Git branch:

|Branch       |Environment      |Cloud Provider       |Auto-Deploy          |Typical Use Case               |
|-------------|-----------------|---------------------|---------------------|-------------------------------|
|`develop`    |Staging          |Render               |✅ Yes               |Testing pre-released features  |
|`main`       |Production       |OVH/Digital Ocean    |🚫 Approval Needed   |Stable releases                |


### Deployment Flow
![Deployment Flow](docs/worflow_deployment.svg)


### Environment Setup
**Github Requirements**  
- Ensure GitHub Packages is enabled for your repository
- Configure these secrets in repository settings:
    * `RENDER_API_KEY` (From Render Dashboard)
    * `RENDER_SERVICE_ID` (From Render Dashboard)
    * `SUPABASE_PUBLISHABLE_OR_ANON_KEY` (from Supabase dashboard)
    * `SUPABASE_URL` (from Supabase dashboard)

**Render Requirements**
- Create a Web Service with:
    * Docker image source: `ghcr.io/hscowork/platform-frontend:${GITHUB_SHA_TAG}`.
    * Auto-deploy linked to GitHub repository.


### Access
|Environment      |Access URL                                                    |
|-----------------|--------------------------------------------------------------|
|Staging          |[`https://platform-frontend-4rsy.onrender.com/`](https://platform-frontend-4rsy.onrender.com/)  |
|Production       |[`https://api.example.com`](https://api.example.com)          |

