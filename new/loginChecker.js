export async function checkLogin() {
  const result = await fetch('/testCheckToken', {
    method : 'GET',
    headers : {
      'Content-Type':'text/json'
    }
  })
  return await result.json();
}