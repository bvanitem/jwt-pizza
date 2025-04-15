# Curiosity Report: Progressive Delivery

## Introduction
I chose **Progressive Delivery** for this report because it feels like a missing piece in our course’s deployment and testing topics. It’s a smart way to release software slowly and safely using data. This report shares what I learned about Progressive Delivery, how it works, and why it matters for DevOps.

## What is Progressive Delivery?
Progressive Delivery is a DevOps strategy to roll out new features gradually to small groups of users. It uses real-time data, like error rates or user feedback, to decide whether to keep going or roll back. It’s like a safer version of canary deployments.

Key points:
- **Slow Rollouts**: Start with a few users and grow if things look good.
- **Data-Driven**: Tools check metrics to spot problems early.
- **Easy Fixes**: If the new version fails, switch back to the old one fast.
- **User Groups**: Target specific users, like testers or regions.

## How It Works
1. **Deploy Feature**: Add new code to production, but keep it hidden.
2. **Test Small**: Turn it on for a tiny group, like 5% of users.
3. **Check Data**: Watch metrics (e.g., crashes, speed) to see if it’s stable.
4. **Grow or Stop**: If good, roll out to more users. If bad, go back.
5. **Finish**: When stable, everyone gets the feature.

## Why It’s Great
- **Safer Releases**: Bugs affect fewer people, keeping most users happy.
- **Quick Fixes**: Rollbacks are easy, avoiding big outages.
- **Better Testing**: Try new features in production with less risk.
- **Flexible**: Test ideas or launch features for specific groups.

## Challenges
- **Needs Tools**: You need monitoring or flag systems.
- **Can Be Tricky**: Picking the right metrics to watch takes practice.
- **Costs More**: Running extra systems for rollouts uses more cloud resources.

## Tools
- **Argo Rollouts**: Works with Kubernetes (Kubernetes is a tool that manages containerized apps, like those in Docker) to manage rollouts.
- **LaunchDarkly**: Controls features and tracks data.
- **Grafana**: Shows metrics to guide decisions (like in our course).
- **Istio**: Routes traffic for microservices.

## Connection to Our Course
Progressive Delivery fits with what we studied:
- **Deployments**: It’s like Blue-Green or GitHub releases but more controlled.
- **Testing**: Helps test in production, similar to Playwright or Jest.
- **Pipelines**: Works with GitHub Actions for automation.
- **Monitoring**: Uses Grafana metrics, like our observability labs.

## Cool Facts
- **Big Companies**: GitHub and Uber use it to test features safely.
- **Automation**: Systems can decide rollouts, but humans can step in.
- **Newer Idea**: Grew from canary deployments around 2018.

## What I Think
Progressive Delivery is awesome because it makes releases less scary. I like how it uses data to decide what’s safe, like a smarter version of what we did with Grafana. I want to try it with Argo in a small project. The hardest part seems to be choosing good metrics, but it’s worth it for smoother launches.

## Conclusion
Progressive Delivery is a safe, smart way to release software step-by-step, using data to avoid problems. It belongs in our course because it builds on deployments, testing, and metrics. I’m excited to use it to make projects like JWT Pizza more reliable.