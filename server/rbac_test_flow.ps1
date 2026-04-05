$ErrorActionPreference='Stop'
function tryLoginOrRegister($email,$password,$name,$role){
  try {
    $res = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/rbac/auth/login' -ContentType 'application/json' -Body (@{email=$email; password=$password} | ConvertTo-Json)
    return $res
  } catch {
    $res = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/rbac/auth/register' -ContentType 'application/json' -Body (@{name=$name; email=$email; password=$password; role=$role} | ConvertTo-Json)
    return $res
  }
}

Write-Output 'Starting RBAC test flow...'

$hr = tryLoginOrRegister 'hr@company.com' 'HRPassword123' 'Alice HR Manager' 'HR'
Write-Output "HR: $($hr | ConvertTo-Json -Compress)"
$hrToken = $hr.token

$emp1 = tryLoginOrRegister 'employee1@company.com' 'EmpPassword123' 'Bob Developer' 'Employee'
Write-Output "EMP1: $($emp1 | ConvertTo-Json -Compress)"
$emp1Id = $emp1.user.id

$emp2 = tryLoginOrRegister 'employee2@company.com' 'EmpPassword456' 'Carol Designer' 'Employee'
Write-Output "EMP2: $($emp2 | ConvertTo-Json -Compress)"
$emp2Id = $emp2.user.id

$headers = @{ Authorization = "Bearer $hrToken" }
Write-Output 'Creating board...'
try {
  $board = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/rbac/boards' -Headers $headers -ContentType 'application/json' -Body (@{title='Q1 2024 Project'; description='Main project for Q1 planning'} | ConvertTo-Json)
  Write-Output "BOARD: $($board | ConvertTo-Json -Compress)"
  $boardId = $board.board._id
} catch {
  # Print full error response content for debugging
  try {
    $stream = $_.Exception.Response.GetResponseStream()
    $sr = New-Object System.IO.StreamReader($stream)
    $content = $sr.ReadToEnd()
    Write-Output "BOARD_CREATE_ERROR_RAW:"
    Write-Output $content
  } catch {
    Write-Output "BOARD_CREATE_ERROR: $($_.Exception.Message)"
  }
  exit 1
}

Write-Output 'Adding members...'
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/rbac/boards/$boardId/members" -Headers $headers -ContentType 'application/json' -Body (@{userId=$emp1Id} | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/rbac/boards/$boardId/members" -Headers $headers -ContentType 'application/json' -Body (@{userId=$emp2Id} | ConvertTo-Json) | Out-Null
Write-Output 'Members added.'

# Create a task assigned to employee1
Write-Output 'Creating task...'
$taskBody = @{ title='Design UI Mockups'; description='Create mockups'; priority='High'; deadline='2024-02-15'; columnId=$null; assignees=@($emp1Id); tags=@('design','ui') } | ConvertTo-Json
$task = Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/rbac/tasks/board/$boardId" -Headers $headers -ContentType 'application/json' -Body $taskBody
Write-Output "TASK: $($task | ConvertTo-Json -Compress)"

# Fetch tasks as employee1
Write-Output 'Fetching tasks as employee1...'
$emp1Token = $emp1.token
$emp1hdr = @{ Authorization = "Bearer $emp1Token" }
$tasksEmp1 = Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/rbac/tasks/board/$boardId" -Headers $emp1hdr -ErrorAction SilentlyContinue
Write-Output "EMP1_TASKS: $($tasksEmp1 | ConvertTo-Json -Compress)"

Write-Output 'RBAC test flow complete.'
