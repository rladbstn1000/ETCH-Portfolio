from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "batch-server"}

# 로컬 개발 시 실행 (도커에서는 CMD에서 실행되므로 생략해도 무방)
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8082)

