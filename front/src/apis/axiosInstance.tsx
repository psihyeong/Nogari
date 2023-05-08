import axios, { AxiosInstance } from 'axios'

const BASE_URL = `${import.meta.env.VITE_SERVER_URL}` // 로컬 서버

// 단순 get요청으로 인증값이 필요없는 경우
const axiosApi = (url: string, options?: object) => {
  const instance = axios.create({ baseURL: url, ...options })
  return instance
}

// post, delete등 api요청 시 인증값이 필요한 경우
const axiosAuthApi = (url: string, options?: object) => {
  const instance = axios.create({
    baseURL: url,
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
    },
    ...options,
  })
  interceptors(instance)
  return instance
}

// refresh token 으로 갱신 필요한 경우
function postRefreshToken() {
  const response = axBase.post('/members/refresh', {
    access_token: sessionStorage.getItem('accessToken'),
    refresh_token: sessionStorage.getItem('refreshToken'),
  })

  return response
}

export const interceptors = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    async (response) => {
      const { config } = response

      if (response.data?.resultCode !== 200) {
        const originRequest = config
        // console.log(originRequest)
        try {
          const tokenResponse = await postRefreshToken()
          const resultCode = tokenResponse.data.resultCode
          if (resultCode === 200) {
            const newAccessToken = tokenResponse.data.result.access_token
            sessionStorage.setItem(
              'acessToken',
              tokenResponse.data.result.access_token
            )
            axios.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
            originRequest.headers.Authorization = `Bearer ${newAccessToken}`
            return axios(originRequest)
          }
          console.log(tokenResponse)
          // if (tokenResponse.data?.resultCode === 200) {
          //   console.log(tokenResponse.data?.resultMessage)
          // } else {
          //   console.log('---------------------')
          //   console.log(tokenResponse?.data?.resultMessage)
          // }
        } catch (error) {
          console.log(error)
        }
      }
      return response
    },
    async (error) => {
      const {
        config,
        response: { status },
      } = error

      // console.log('interceptor error')
      // console.log(status)
      return Promise.reject(error.response)
    }
  )

  return instance
}
export const axBase = axiosApi(BASE_URL)
export const axAuth = axiosAuthApi(BASE_URL)
