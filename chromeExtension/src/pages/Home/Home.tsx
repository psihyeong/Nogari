import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { checkUrl } from './utils'
import { getLog, postTistory } from '../../apis/apis'

function Home() {
  const [log, setLog] = useState({
    title: '',
    status: '발행 이력 확인 중',
    responseLink: '발행 이력 없음',
    date: '',
  })
  const { register, handleSubmit, reset } = useForm<Tpost>()

  useEffect(() => {
    const user = localStorage.getItem('user')
    chrome.storage.sync.get([`${user}-tistory-setting`], (saved) => {
      const requestData = {
        ...saved[`${user}-tistory-setting`],
        type: 'html',
        status: '발행요청',
      }
      reset(requestData)
    })

    const logResponse = getLog()
    logResponse
      .then((res) => {
        const data = res.data.result[0][0]
        if (data) {
          const date = new Date(data.modifiedDate)
          const parsedLog = {
            title: data.title,
            status: data.status,
            responseLink: data.responseLink,
            date: date.toISOString().split('T')[0] + ' / ' + date.toTimeString().split(' ')[0],
          }
          setLog(parsedLog)
        } else {
          setLog((prev) => ({ ...prev, status: '발행 이력 없음' }))
        }
      })
      .catch((err) => console.log(err))
  }, [])

  const PublishHandler = (data: Tpost) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      const tab = tabs[0]
      const requestLink = tab.url
      if (!checkUrl(requestLink)) {
        alert('올바른 notion 페이지에서 발행해주세요.')
        return
      }
      const requestData: Tpost = {
        ...data,
        requestLink: requestLink as string,
      }

      try {
        const response = await postTistory(requestData)
        if (response.data.result.body[0].resultCode === 200) {
          getLog().then((res) => {
            const data = res.data.result[0][0]
            const date = new Date(data.modifiedDate)
            date.setHours(date.getHours() + 9)
            const parsedLog = {
              title: data.title,
              status: data.status,
              responseLink: data.responseLink,
              date: date.toISOString().split('T')[0] + ' / ' + date.toTimeString().split(' ')[0],
            }
            setLog(parsedLog)
          })
        }
      } catch (err: any) {
        alert('발행에 실패했습니다. 설정을 확인해 주세요.')
      }
    })
  }

  const openLink = () => {
    chrome.tabs.create({ url: log.responseLink })
  }

  return (
    <div>
      <h1>최신 발행 로그</h1>
      <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.3rem' }}>{log.status} </div>
        <div style={{ fontSize: '1rem' }}>
          <div style={{ fontSize: '0.8rem' }}>{log.date}</div>
          <span style={{ cursor: 'pointer', color: 'blue' }} onClick={openLink}>
            {log.title}
          </span>
        </div>
      </div>
      <form onSubmit={handleSubmit(PublishHandler)}>
        <label htmlFor="tistory-tag">태그 ( , 로 구분합니다.)</label>
        <div>
          <input id="tistory-tag" type="text" {...register('tagList')} />
          <button type="submit">발행하기</button>
        </div>
      </form>
    </div>
  )
}

export default Home
