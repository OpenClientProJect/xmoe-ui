<script setup>
import {onMounted, onUnmounted, ref, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {getDramaDetailService, getRelatedDramaService, getVideoUrlService} from '@/api/Drama.js'
import {ArrowDown, ArrowUp, ChatDotRound, Share} from "@element-plus/icons-vue"
import {ElMessage} from 'element-plus'
import {handleImageUrl} from '@/utils/imageUtils.js'
//icon
import Collection from '@/assets/icon/collection.svg'
import Ringtones from '@/assets/icon/ringtones.svg'
import Loading from '@/assets/gif/loading.gif'
// 导入顶部导航栏组件
import HeaderNav from '@/views/home/common/HeaderNav.vue'
// 导入播放器组件
import VideoPlayer from '@/components/player/VideoPlayer.vue'
// 导入相关推荐组件
import RelatedRecommend from '@/components/common/RelatedRecommend.vue'
import {getCommentsService, sendCommentService} from "@/api/comments.js";
import {addHistoryService, isFollowService, sendRemindService} from "@/api/user.js";
import useUserInfoStore from "@/stores/userstores.js";

const router = useRouter()
const route = useRoute()
const userStore = useUserInfoStore()

// 顶部导航栏选中的标签
const headerActiveTab = ref('番剧') // 默认选中番剧标签

// 侧边栏显示内容控制（剧集/评论）
const sidebarContent = ref('episodes') // 'episodes'表示显示剧集列表，'comments'表示显示评论区

// 获取视频ID，同时支持路由参数和查询参数
const videoId = route.params.id || route.query.id
const playerRef = ref(null) // 播放器组件引用
const currentVideoUrl = ref('') // 当前播放的视频URL
const currentEpisode = ref(null)
const currentSource = ref(0) // 当前线路，默认为第一个
const episodes = ref([]) // 当前线路的剧集列表
const allEpisodes = ref({}) // 存储所有线路的剧集数据
const relatedVideos = ref([])// 相关视频列表
const isRelatedLoading = ref(false) // 相关推荐加载状态
// 视频信息
const videoInfo = ref({
  id: videoId,
  title: '',
  typeId: '',
  vodArea: '',
  vodClass: '',
  cover: '',
  episode: '',
  views: '',
  likes: '',
  releaseDate: '',
  description: '',
  tags: [],
  sources: [],
  isLiked: false,
  isCollected: false,
  isSubscribed: true
})
//评论数据
const comments = ref({
  count: 0,
  lists: []
})

const activeTab = ref('评论(0)')
const tabs = [
  {name: '评论(0)'},
]

// 格式化时间戳为可读日期
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 控制简介内容的显示/隐藏
const showFullDescription = ref(false)

// 检查用户是否登录
const isUserLoggedIn = computed(() => {
  return !!(userStore.info && userStore.info.user_id);
});

//  处理订阅按钮点击事件
const toggleSubscribe = () => {
  sendRemindService({
    content: '催更',
    user_id: userStore.info.user_id,
  })
}

// 切换侧边栏内容
const switchSidebarContent = (content) => {
  sidebarContent.value = content
}

// 处理播放器返回按钮事件
const handlePlayerBack = () => {
  console.log('播放器返回按钮点击');
  router.push('/'); // 返回首页
}

// 处理登录事件
const handleLogin = () => {
  // 保存当前路径，登录后可以返回
  localStorage.setItem('loginRedirectUrl', window.location.pathname);

  // 跳转到登录页面
  router.push('/login');
}

// 处理播放器事件
const handlePlayerError = (error) => {
  console.error('播放器错误:', error)
}

const handlePlayerPlay = () => {
  console.log('开始播放')
}

const handlePlayerPause = () => {
  console.log('暂停播放')
}

const handlePlayerEnded = () => {
  console.log('播放结束')
  // 自动播放下一集
  handleNextEpisode()
}

const handlePlayerTimeUpdate = (currentTime) => {
  // 可以在这里处理播放进度更新
}

// 播放视频
const playVideo = async (episodeId) => {
  console.log("播放剧集id:", episodeId)
  const episode = episodes.value.find(ep => ep.id === episodeId)
  if (!episode) {
    console.error('找不到剧集信息')
    ElMessage.error('无效的剧集信息')
    return null
  }

  if (!episode.sourceId) {
    console.error('剧集缺少播放源ID')
    ElMessage.error('无效的视频源')
    return null
  }

  try {
    // 先停止当前视频播放
    if (playerRef.value) {
      const player = playerRef.value.getPlayer()
      if (player) {
        // 暂停视频
        player.pause()
        // 重置视频时间
        player.seek = 0
        // 清空播放源
        player.url = ''
      }
      // 重置播放URL
      currentVideoUrl.value = ''
    }
    
    // 先重置当前选中的剧集
    currentEpisode.value = null

    // 然后设置新的当前剧集
    currentEpisode.value = episode

    // 标记当前集为已观看
    episode.watched = true

    // 添加到播放记录
    await addPlayHistory()

    // 调用API获取视频地址
    const res = await getVideoUrlService(episode.sourceId)

    // 检查响应状态
    if (res.code !== 200 || !res.data) {
      throw new Error(res.message || '获取视频地址失败')
    }

    // 处理视频URL，确保可以正确播放
    let videoUrl = ''

    // 检查res.data的类型并提取URL
    if (typeof res.data === 'string') {
      videoUrl = res.data
    } else if (typeof res.data === 'object') {
      if (res.data.url) {
        videoUrl = res.data.url
      } else {
        for (const key in res.data) {
          if (typeof res.data[key] === 'string' &&
              (res.data[key].includes('http') ||
                  res.data[key].includes('.mp4') ||
                  res.data[key].includes('.m3u8'))) {
            videoUrl = res.data[key]
            break
          }
        }
      }
    }

    if (!videoUrl) {
      throw new Error('无法从响应中提取视频地址')
    }

    // 更新当前播放的视频URL
    currentVideoUrl.value = videoUrl

    return videoUrl
  } catch (error) {
    console.error('播放视频失败:', error)
    ElMessage.error('视频加载失败，请尝试切换线路')
    return null
  }
}

const isFollowing = ref(false)
//判断是否已追番

const checkIsFollowing = async () => {
  const res = await isFollowService({
    user_id: userStore.info.user_id,
    ulog_rid: videoInfo.value.id,
    ulog_type: 4
  })
  if (res.data === 1) {
    isFollowing.value = true
  }
}
// 切换线路
const switchSource = (sourceId) => {
  // 先重置当前选中的剧集
  currentEpisode.value = null
  currentVideoUrl.value = ''

  // 重置所有线路剧集的选中状态
  Object.values(allEpisodes.value).forEach(episodeList => {
    episodeList.forEach(episode => {
      // 保留watched状态，但取消选中状态
      if (episode === currentEpisode.value) {
        currentEpisode.value = null
      }
    })
  })

  // 更新当前线路
  currentSource.value = sourceId

  // 加载对应线路的剧集数据
  if (allEpisodes.value[sourceId]) {
    episodes.value = allEpisodes.value[sourceId]
    console.log('切换到线路', sourceId, '剧集数:', episodes.value.length)
  } else {
    ElMessage.warning('该线路暂无剧集数据')
    episodes.value = []
  }
}

// 改进tab切换
const setActiveTab = (tab) => {
  activeTab.value = tab
}

// 复制当前页面链接
const copyCurrentUrl = () => {
  // 获取当前页面的完整URL
  const currentUrl = window.location.href

  // 使用Clipboard API复制到剪贴板
  navigator.clipboard.writeText(currentUrl)
      .then(() => {
        // 复制成功提示
        ElMessage.success('链接已复制到剪贴板')
      })
      .catch(err => {
        // 复制失败提示
        console.error('复制失败:', err)
        fallbackCopyTextToClipboard(currentUrl)
      })
}

// 备用复制方案
const fallbackCopyTextToClipboard = (text) => {
  try {
    // 创建一个临时文本区域
    const textArea = document.createElement('textarea')
    textArea.value = text

    // 避免滚动到视图中
    textArea.style.position = 'fixed'
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.width = '2em'
    textArea.style.height = '2em'
    textArea.style.padding = '0'
    textArea.style.border = 'none'
    textArea.style.outline = 'none'
    textArea.style.boxShadow = 'none'
    textArea.style.background = 'transparent'

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    // 执行复制命令
    const successful = document.execCommand('copy')
    if (successful) {
      ElMessage.success('链接已复制到剪贴板')
    } else {
      ElMessage.error('复制失败，请手动复制')
    }

    // 清理
    document.body.removeChild(textArea)
  } catch (err) {
    console.error('复制失败:', err)
    ElMessage.error('复制失败，请手动复制')
  }
}

// 跳转到视频详情页
const goToVideoDetail = (id) => {
  if (!id) {
    console.error('无效的视频ID')
    return
  }

  // 如果是当前视频，不需要跳转
  if (id.toString() === videoId.toString()) {
    console.log('当前已经是该视频，无需跳转')
    return
  }

  console.log('跳转到视频详情页,ID:', id)

  // 停止当前视频播放
  if (playerRef.value) {
    try {
      // 尝试暂停视频播放
      const videoElement = playerRef.value.$el.querySelector('video')
      if (videoElement) {
        videoElement.pause()
        videoElement.src = ''
        videoElement.load()
      }
    } catch (e) {
      console.error('停止视频播放失败:', e)
    }
  }

  // 强制使用全新的URL并刷新页面，而不是使用路由跳转
  window.location.href = `/video/${id}`
}

// 组件卸载时清理资源
onUnmounted(() => {
  // 清理播放器资源
  if (playerRef.value) {
    try {
      const player = playerRef.value.getPlayer();
      if (player) {
        player.pause();
      }
    } catch (e) {}
  }
  
  // 移除事件监听器
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', optimizeImageLoading)
  window.removeEventListener('resize', checkMobileScreen)
})

// 获取视频详情
const getVideoDetail = async () => {
  try {
    console.log('获取视频详情，ID:', videoId)
    const res = await getDramaDetailService(videoId)

    if (res.code === 200 && res.data) {
      const data = res.data
      console.log('获取到视频详情数据:', data)

      // 更新视频信息
      videoInfo.value = {
        id: data.vod_id,
        title: data.vod_name,
        typeId: data.type_id,
        vodArea: data.vod_area,
        vodClass: data.vod_class,
        cover: handleImageUrl(data.vod_pic),
        episode: data.vod_remarks,
        views: data.vod_hits || '0',
        likes: data.vod_up || '0',
        releaseDate: data.vod_pubdate || data.vod_year || '',
        description: data.vod_content || data.vod_blurb || '',
        tags: data.vod_class ? data.vod_class.split(',') : [],
        actors: data.vod_actor ? data.vod_actor.split(',') : [],
        area: data.vod_area || '',
        year: data.vod_year || '',
        weekday: data.vod_weekday || '',
        isLiked: false,
        isCollected: false,
        isSubscribed: true
      }
      console.log('设置后的videoInfo:', videoInfo.value)

      // 存储不同线路的剧集数据
      allEpisodes.value = {}

      // 如果有播放地址，处理剧集信息
      if (data.vod_play_url) {
        // 处理所有线路的剧集数据
        const playUrls = data.vod_play_url.split('$$$')

        // 处理线路信息
        const sourcesInfo = playUrls.map((source, index) => {
          const lines = ['官方', '主线路', '备用线路']
          const name = index < lines.length ? lines[index] : `线路${index + 1}`

          // 统计该线路的剧集数
          const episodeCount = source.split('#').filter(ep => ep.includes('$')).length

          // 处理该线路的剧集列表
          const episodesData = source.split('#').map((item, epIndex) => {
            // 排除空项
            if (!item.trim()) {
              return null;
            }

            const parts = item.split('$');
            // 确保至少有两部分：标题和ID
            if (parts.length < 2) {
              console.warn('剧集格式不正确:', item);
              return null;
            }

            const title = parts[0] || `第${epIndex + 1}集`;

            // 如果有多个$分隔符，则合并后面的部分作为ID
            let id = '';
            if (parts.length > 2) {
              id = parts.slice(1).join('$');
            } else {
              id = parts[1] || '';
            }

            return {
              id: epIndex + 1,
              title: title,
              sourceId: id, // 保存原始ID用于请求
              watched: false,
              duration: '24:00',
              sourceIndex: index // 添加线路索引
            };
          }).filter(item => item && item.sourceId); // 过滤掉无效和没有sourceId的项

          // 存储该线路的剧集数据
          if (episodesData.length > 0) {
            allEpisodes.value[index] = episodesData;
          }

          return {
            id: index,
            name: name,
            count: episodeCount
          }
        }).filter(item => item.count > 0) // 过滤掉没有剧集的线路

        videoInfo.value.sources = sourcesInfo
        console.log('线路信息:', sourcesInfo)

        // 更新剧集列表
        if (sourcesInfo.length > 0) {
          // 默认使用第一个线路
          currentSource.value = 0;
          episodes.value = allEpisodes.value[0] || [];
        }
      }
    } else {
      ElMessage.warning(res.message || '获取视频信息失败')
    }
  } catch (error) {
    console.error('获取视频详情失败:', error)
  }
}
//相关推荐
const getRelatedDrama = async () => {
  try {
    isRelatedLoading.value = true;

    const res = await getRelatedDramaService(videoInfo.value.typeId)

    // 根据响应数据结构进行适配
    let relatedData = [];

    if (Array.isArray(res.data)) {
      relatedData = res.data;
    } else if (res.data && res.data.list) {
      // 旧的响应格式，有list属性
      relatedData = res.data.list;
    }

    // 处理相关推荐数据
    relatedVideos.value = relatedData.map(item => ({
      id: item.vod_id,
      title: item.vod_name,
      cover: handleImageUrl(item.vod_pic),
      views: item.vod_hits || '0',
      episode: item.vod_remarks || '',
      score: item.vod_score || '0',
      tags: item.vod_class ? item.vod_class.split(',') : []
    }));
  } catch (error) {
    console.error('获取相关推荐失败:', error);
  } finally {
    isRelatedLoading.value = false;
  }
}

/**
 * 获取评论数据
 */
const getComments = async () => {
  const res = await getCommentsService(videoId)
  comments.value = res.data
  // 更新评论数量显示
  tabs[0].name = `评论(${comments.value.count || 0})`
}

/**
 * 添加追番
 */
const toggleCollect = async () => {
  // 检查用户是否登录
  if (!userStore.info || !userStore.info.user_id) {
    ElMessage.warning('请先登录');
    return;
  }

  if (!isFollowing.value) {
    await addHistoryService({
      user_id: userStore.info.user_id,
      ulog_type: 2,
      ulog_rid: videoId,
    });
    ElMessage.success('追番成功');
    // 更新状态
    isFollowing.value = true;
  } else {
    ElMessage.info('已经追番了');
  }
}

/**
 * 添加播放记录
 */
const addPlayHistory = async () => {
  // 检查用户是否登录
  if (!userStore.info || !userStore.info.user_id) {
    console.log('用户未登录，不添加播放记录');
    return;
  }
  await addHistoryService({
    user_id: userStore.info.user_id,
    ulog_type: 4,
    ulog_rid: videoId,
  });
}

// 添加侧边栏显示控制状态
const showSidebar = ref(true)

// 切换侧边栏显示/隐藏
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 添加抽屉弹窗控制
const showDetailDrawer = ref(false)

// 打开详情抽屉
const openDetailDrawer = () => {
  showDetailDrawer.value = true
  // 禁止底层页面滚动
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
  document.body.style.top = `-${window.scrollY}px`
}

// 关闭详情抽屉
const closeDetailDrawer = () => {
  showDetailDrawer.value = false
  // 恢复底层页面滚动
  const scrollY = document.body.style.top
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
  document.body.style.top = ''
  window.scrollTo(0, parseInt(scrollY || '0') * -1)
}

// 添加评论输入变量
const comment = ref('')

// 添加回复相关变量
const replyMode = ref(false)
const replyTo = ref(null)
const replyPlaceholder = ref('发表你的评论...')

// 添加移动设备检测变量
const isMobile = ref(false)

// 检测当前屏幕尺寸是否为移动设备
const checkMobileScreen = () => {
  isMobile.value = window.innerWidth < 1024
}

// 开始回复
const startReply = (commentItem) => {
  replyMode.value = true
  replyTo.value = commentItem
  replyPlaceholder.value = `回复 ${commentItem.comment_name}`
}

// 取消回复
const cancelReply = () => {
  replyMode.value = false
  replyTo.value = null
  replyPlaceholder.value = '发表你的评论...'
}

//发送评论
const sendComment = async () => {
  // 检查用户是否登录
  if (!userStore.info || !userStore.info.user_id) {
    ElMessage.warning('请先登录');
    return;
  }

  // 检查评论内容是否为空
  if (!comment.value.trim()) {
    ElMessage.warning('评论内容不能为空');
    return;
  }

  try {
    const params = {
      user_id: userStore.info.user_id,
      user_name: userStore.info.user_name,
      user_nick_name: userStore.info.user_nick_name,
      content: comment.value,
      vod_id: videoId,
      type: replyMode.value ? 'reply' : 'comment',
      comment_mid: '0',
      comment_pid: replyMode.value ? replyTo.value.comment_id : '0',
      reply_user_id: replyMode.value ? replyTo.value.user_id : '',
    }

    await sendCommentService(params)

    // 发送成功后清空输入框
    ElMessage.success('评论发送成功');
    comment.value = '';

    // 如果是回复模式，退出回复模式
    if (replyMode.value) {
      cancelReply()
    }

    // 重新获取评论列表
    await getComments();
  } catch (error) {
    console.error('发送评论失败:', error);
    ElMessage.error('评论发送失败，请稍后重试');
  }
}

// 处理下一集按钮点击
const handleNextEpisode = () => {
  if (!currentEpisode.value || !episodes.value.length) {
    ElMessage.info('没有下一集了')
    return
  }

  // 查找当前剧集在列表中的索引
  const currentIndex = episodes.value.findIndex(ep => ep.id === currentEpisode.value.id)

  // 如果找不到当前剧集或已经是最后一集，则提示
  if (currentIndex === -1 || currentIndex >= episodes.value.length - 1) {
    ElMessage.info('已经是最后一集了')
    return
  }

  // 获取下一集的信息
  const nextEpisode = episodes.value[currentIndex + 1]

  // 播放下一集
  playVideo(nextEpisode.id)

  // 滚动到对应的剧集项
  setTimeout(() => {
    const episodeElement = document.querySelector(`.episode-item[data-episode-id="${nextEpisode.id}"]`)
    if (episodeElement) {
      episodeElement.scrollIntoView({behavior: 'smooth', block: 'nearest'})
    }
  }, 300)
}

onMounted(async () => {
  // 检测当前设备类型
  checkMobileScreen()
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', checkMobileScreen)
  
  // 加载基本数据 - 使用Promise.all并行请求
  try {
    await Promise.all([
      getVideoDetail(),
      getComments()
    ]);
    
    // 加载用户相关数据
    if (isUserLoggedIn.value) {
      await checkIsFollowing();
    }
    
    // 加载相关推荐 - 可以稍后加载
    getRelatedDrama();
    
    // 尝试自动播放第一集
    if (episodes.value?.length > 0) {
      try {
        const result = await playVideo(episodes.value[0].id);
        
        // 如果第一条线路播放失败且有多条线路，尝试切换线路
        if (!result && videoInfo.value.sources?.length > 1) {
          switchSource(1);
          // 等待线路切换完成后尝试播放
          setTimeout(async () => {
            if (episodes.value?.length > 0) {
              await playVideo(episodes.value[0].id);
            }
          }, 300);
        }
      } catch (error) {
        console.error('自动播放失败:', error);
      }
    }
  } catch (error) {
    console.error('初始化视频页面失败:', error);
    ElMessage.error('加载视频数据失败');
  }
})
</script>

<template>
  <div class="video-detail-page-wrapper">
    <div class="video-detail-container">
      <!-- 顶部导航栏 -->
      <div class="header-container">
        <HeaderNav
            :hide-in-video-detail="true"
        />
      </div>

      <!-- 视频播放区域和信息区域的布局容器 -->
      <div class="player-info-layout" :class="{'sidebar-hidden': !showSidebar}">
        <!-- 视频播放器区域 -->
        <div class="player-wrapper">
          <VideoPlayer
              ref="playerRef"
              :url="currentVideoUrl"
              :title="videoInfo.title"
              :poster="videoInfo.cover"
              :video-id="videoId"
              :show-back-button="true"
              :show-sidebar="showSidebar"
              :on-next-episode="handleNextEpisode"
              :is-logged-in="isUserLoggedIn"
              @error="handlePlayerError"
              @play="handlePlayerPlay"
              @pause="handlePlayerPause"
              @ended="handlePlayerEnded"
              @timeupdate="handlePlayerTimeUpdate"
              @back="handlePlayerBack"
              @toggleSidebar="toggleSidebar"
              @next="handleNextEpisode"
              @login="handleLogin"
          />
        </div>

        <!-- 右侧信息区域容器 -->
        <div class="sidebar-wrapper" v-show="showSidebar">
          <!-- 侧边栏内容选择标签页 -->
          <div class="sidebar-tabs">
            <div
                class="sidebar-tab"
                :class="{ active: sidebarContent === 'episodes' }"
                @click="switchSidebarContent('episodes')"
            >
              剧集 ({{ episodes.length }})
            </div>
            <div
                class="sidebar-tab"
                :class="{ active: sidebarContent === 'comments' }"
                @click="switchSidebarContent('comments')"
            >
              评论 ({{ comments.count || 0 }})
            </div>
          </div>

          <!-- 剧集页面内容 -->
          <div v-if="sidebarContent === 'episodes'" class="sidebar-content desktop-only">
            <!-- 视频信息 - 添加到剧集选项中 -->
            <div class="sidebar-video-info">
              <h2 class="sidebar-video-title">{{ videoInfo.title }}</h2>
              <div class="video-stats">
                <span class="stat-item">{{ videoInfo.views }}次观看</span>
                <span>{{ videoInfo.vodArea }}/</span>
                <span>{{ videoInfo.releaseDate }}/</span>
                <span>{{ videoInfo.vodClass }}</span>
              </div>

              <!-- 标签列表 -->
              <div class="sidebar-tag-list">
                <span
                    v-for="tag in videoInfo.tags"
                    :key="tag"
                    class="tag"
                >
                  {{ tag }}
                </span>
              </div>

              <!-- 简介区域 -->
              <div class="sidebar-description-section">
                <div class="description" :class="{ 'collapsed': !showFullDescription }">
                  {{ videoInfo.description }}
                </div>
                <div class="show-more" @click="showFullDescription = !showFullDescription">
                  {{ showFullDescription ? '收起' : '展开' }}
                  <el-icon>
                    <ArrowDown v-if="!showFullDescription"/>
                    <ArrowUp v-else/>
                  </el-icon>
                </div>
              </div>

              <!-- 操作栏 -->
              <div class="sidebar-action-bar">
                <div class="action-btn" :class="{'following': isFollowing}" @click="toggleCollect">
                  <el-icon size="18">
                    <img :src="Collection" alt="">
                  </el-icon>
                  <span class="action-text">{{ isFollowing ? '已追番' : '追番' }}</span>
                </div>
                <div class="action-btn" @click="toggleSubscribe">
                  <el-icon size="18">
                    <img :src="Ringtones" alt="">
                  </el-icon>
                  <span class="action-text">催更</span>
                </div>
                <div class="action-btn" @click="copyCurrentUrl">
                  <el-icon size="18">
                    <Share/>
                  </el-icon>
                  <span class="action-text">分享</span>
                </div>
              </div>
            </div>

            <!-- 线路选择 -->
            <div v-if="videoInfo.sources && videoInfo.sources.length > 1" class="source-tabs">
              <div
                  v-for="source in videoInfo.sources"
                  :key="source.id"
                  class="source-tab"
                  :class="{'active-source': currentSource === source.id}"
                  @click="switchSource(source.id)"
              >
                {{ source.name }} ({{ source.count }}集)
              </div>
            </div>

            <div v-if="episodes.length === 0" class="no-episodes">
              加载剧集中...
            </div>

            <div v-else class="episodes-grid-sidebar">
              <div
                  v-for="episode in episodes"
                  :key="`${currentSource}-${episode.id}`"
                  class="episode-item"
                  :class="{
                  'current-episode': currentEpisode && episode.id === currentEpisode.id,
                  'watched-episode': episode.watched && (!currentEpisode || episode.id !== currentEpisode.id)
                }"
                  :data-episode-id="episode.id"
                  @click="playVideo(episode.id)"
              >
                <div class="episode-title">{{ episode.title }}</div>
                <div class="episode-source-type" v-if="episode.sourceType">{{ episode.sourceType }}</div>
                <div
                    v-if="episode.watched"
                    class="progress-bar"
                >
                  <div class="progress-fill"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 评论页面内容（仅在桌面端显示） -->
          <div v-if="sidebarContent === 'comments'" class="sidebar-content comment-sidebar desktop-only">
            <!-- 评论列表 -->
            <div v-if="comments.lists && comments.lists.length > 0" class="comment-list">
              <div v-for="commentItem in comments.lists"
                   :key="commentItem.comment_id"
                   class="comment-item">
                <div class="comment-avatar">
                  <img :src="commentItem.user_pic || Loading" alt="用户头像">
                </div>
                <div class="comment-content">
                  <div class="comment-header">
                    <div class="comment-author">{{ commentItem.comment_name }}</div>
                    <div class="comment-date">{{ formatDate(commentItem.comment_time) }}</div>
                  </div>
                  <div class="comment-text">{{ commentItem.comment_content }}</div>

                  <!-- 回复列表 -->
                  <div v-if="commentItem.rp_lists && commentItem.rp_lists.length > 0" class="reply-list">
                    <div v-for="reply in commentItem.rp_lists"
                         :key="reply.comment_id"
                         class="reply-item">
                      <div class="reply-avatar">
                        <img :src="reply.user_pic || Loading" alt="用户头像">
                      </div>
                      <div class="reply-content">
                        <div class="reply-header">
                          <div class="reply-author">{{ reply.comment_name }}</div>
                          <div class="reply-date">{{ formatDate(reply.comment_time) }}</div>
                        </div>
                        <div class="reply-text">
                          <span v-if="reply.comment_name2" class="reply-to">@{{ reply.comment_name2 }}：</span>
                          {{ reply.comment_content }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 无评论时显示 -->
            <div v-else class="comment-placeholder">
              <el-icon :size="32" class="mb-2">
                <ChatDotRound/>
              </el-icon>
              <p class="text-sm">暂无评论，快来发表第一条评论吧！</p>
            </div>
            
            <!-- 评论输入区域 -->
            <div class="comment-input-area">
              <div v-if="replyMode" class="reply-indicator">
                回复{{ replyTo?.comment_name }}
                <el-button type="text" class="cancel-reply" @click="cancelReply">取消</el-button>
              </div>
              <div class="comment-input-container">
                <el-input
                    v-model="comment"
                    type="text"
                    :placeholder="replyPlaceholder"
                    class="comment-input"
                />
                <el-button type="primary" @click="sendComment" :disabled="!comment.trim()" class="send-button">发表
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 在移动端显示的剧集列表，仅在剧集页面显示 -->
      <div class="episodes-section mobile-only" v-if="sidebarContent === 'episodes'">
        <div class="episodes-header">
          <h3 class="section-title">剧集</h3>
          <div class="episode-count">
            共{{ episodes.length }}集，{{ videoInfo.episode }}
          </div>
        </div>

        <div class="video-info-wrapper mobile-only" v-if="sidebarContent === 'episodes'">
          <!-- 视频信息 - 只在移动端剧集页面显示简略信息 -->
          <div class="video-info">
            <h1 class="video-title">{{ videoInfo.title }}</h1>
            <div class="video-stats">
              <span class="stat-item">{{ videoInfo.views }}次观看</span>
              <!-- 添加详情按钮 -->
              <span class="detail-button" @click="openDetailDrawer">详情</span>
            </div>
          </div>
        </div>

        <!-- 线路选择 -->
        <div v-if="videoInfo.sources && videoInfo.sources.length > 1" class="source-tabs">
          <div
              v-for="source in videoInfo.sources"
              :key="source.id"
              class="source-tab"
              :class="{'active-source': currentSource === source.id}"
              @click="switchSource(source.id)"
          >
            {{ source.name }} ({{ source.count }}集)
          </div>
        </div>

        <div v-if="episodes.length === 0" class="no-episodes">
          加载剧集中...
        </div>

        <div v-else class="episodes-grid">
          <div
              v-for="episode in episodes"
              :key="`mobile-${currentSource}-${episode.id}`"
              class="episode-item"
              :class="{
              'current-episode': currentEpisode && episode.id === currentEpisode.id,
              'watched-episode': episode.watched && (!currentEpisode || episode.id !== currentEpisode.id)
            }"
              :data-episode-id="episode.id"
              @click="playVideo(episode.id)"
          >
            <div class="episode-title">{{ episode.title }}</div>
            <div class="episode-source-type" v-if="episode.sourceType">{{ episode.sourceType }}</div>
            <div
                v-if="episode.watched"
                class="progress-bar"
            >
              <div class="progress-fill"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 移动端评论区域，仅在评论页面显示 -->
      <div class="comments-section mobile-only" v-if="sidebarContent === 'comments'">
        <!-- 评论列表 -->
        <div v-if="comments.lists && comments.lists.length > 0" class="mobile-comment-list">
          <div v-for="commentItem in comments.lists"
               :key="commentItem.comment_id"
               class="comment-item">
            <div class="comment-avatar">
              <img :src="commentItem.user_pic || Loading" alt="用户头像">
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <div class="comment-author">{{ commentItem.comment_name }}</div>
                <div class="comment-date">{{ formatDate(commentItem.comment_time) }}</div>
              </div>
              <div class="comment-text">{{ commentItem.comment_content }}</div>

              <!-- 回复列表 -->
              <div v-if="commentItem.rp_lists && commentItem.rp_lists.length > 0" class="reply-list">
                <div v-for="reply in commentItem.rp_lists"
                     :key="reply.comment_id"
                     class="reply-item">
                  <div class="reply-avatar">
                    <img :src="reply.user_pic || Loading" alt="用户头像">
                  </div>
                  <div class="reply-content">
                    <div class="reply-header">
                      <div class="reply-author">{{ reply.comment_name }}</div>
                      <div class="reply-date">{{ formatDate(reply.comment_time) }}</div>
                    </div>
                    <div class="reply-text">
                      <span v-if="reply.comment_name2" class="reply-to">@{{ reply.comment_name2 }}：</span>
                      {{ reply.comment_content }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无评论时显示 -->
        <div v-else class="comment-placeholder">
          <el-icon :size="32" class="mb-2">
            <ChatDotRound/>
          </el-icon>
          <p class="text-sm">暂无评论，快来发表第一条评论吧！</p>
        </div>
        
        <!-- 评论输入区域 -->
        <div class="comment-input-area">
          <div v-if="replyMode" class="reply-indicator">
            回复{{ replyTo?.comment_name }}
            <el-button type="text" class="cancel-reply" @click="cancelReply">取消</el-button>
          </div>
          <div class="comment-input-container">
            <el-input
                v-model="comment"
                type="text"
                :placeholder="replyPlaceholder"
                class="comment-input"
            />
            <el-button type="primary" @click="sendComment" :disabled="!comment.trim()" class="send-button">发表
            </el-button>
          </div>
        </div>
      </div>

      <!-- 相关推荐组件 -->
      <RelatedRecommend
          :videos="relatedVideos"
          :title="'相关推荐'"
          :loading="isRelatedLoading"
          @itemClick="goToVideoDetail"
          class="related-recommendations"
          v-if="!isMobile || (isMobile && sidebarContent === 'episodes')"
      />

      <!-- 详情抽屉弹窗 -->
      <div class="detail-drawer-container" v-show="showDetailDrawer" @click.self="closeDetailDrawer">
        <div class="detail-drawer" :class="{ 'open': showDetailDrawer }">
          <div class="drawer-header">
            <h2 class="drawer-title">{{ videoInfo.title }}</h2>
            <div class="close-btn" @click="closeDetailDrawer">×</div>
          </div>

          <div class="drawer-content">
            <!-- 顶部信息区域：左侧封面 + 右侧基本信息 -->
            <div class="drawer-top-info">
              <!-- 封面图片 -->
              <div class="cover-image-container">
                <img :src="videoInfo.cover" alt="视频封面" class="cover-image"/>
              </div>

              <!-- 右侧基本信息 -->
              <div class="info-container">
                <!-- 更新信息 -->
                <div class="update-info">{{ videoInfo.episode }}</div>

                <!-- 演员表 -->
                <div class="actors-list" v-if="videoInfo.actors && videoInfo.actors.length">
                  <div class="actors-line">{{ videoInfo.actors.join(' ') }}</div>
                </div>

                <!-- 标签列表 -->
                <div class="tag-list">
                  <span
                      v-for="tag in videoInfo.tags"
                      :key="tag"
                      class="tag"
                  >
                    {{ tag }}
                  </span>
                </div>

                <!-- 基本元数据 -->
                <div class="meta-info">
                  <div class="meta-item" v-if="videoInfo.area">
                    <span class="meta-value">{{ videoInfo.area }}</span>
                  </div>
                  <div class="meta-item" v-if="videoInfo.year">
                    <span class="meta-value">{{ videoInfo.year }}</span>
                  </div>
                  <div class="meta-item" v-if="videoInfo.weekday">
                    <span class="meta-value">{{ videoInfo.weekday }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 简介区域 -->
            <div class="description-section">
              <h3 class="section-title">影视简介</h3>
              <p class="description drawer-description" v-html="videoInfo.description"></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 最外层页面包装器 */
.video-detail-page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #ffffff;
}

.video-detail-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto; /* 确保容器水平居中 */
  background-color: #ffffff;
}

/* 播放器和信息区域布局 */
.player-info-layout {
  display: flex;
  flex-direction: column;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  width: 100%;
  /* 确保水平居中 */
  margin-left: auto;
  margin-right: auto;
}

/* 侧边栏标签页样式 */
.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 8px;
}

.sidebar-tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  color: #6b7280;
  transition: color 0.3s;
}

.sidebar-tab.active {
  color: #dc2626;
  font-weight: 500;
}

.sidebar-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #dc2626;
}

.sidebar-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: calc(100% - 160px);
  overflow-y: auto;
}

.sidebar-content::-webkit-scrollbar {
  width: 4px;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

/* 侧边栏视频信息样式 */
.sidebar-video-info {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-video-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.sidebar-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}

.sidebar-description-section {
  margin: 12px 0;
}

.sidebar-description-section .description {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
}

.sidebar-description-section .description.collapsed {
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.sidebar-description-section .show-more {
  margin-top: 8px;
  color: #dc2626;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-action-bar {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 评论侧边栏样式 */
.comment-sidebar {
  display: flex;
  flex-direction: column;
  padding: 12px;
  position: relative;
  height: 100%;
  overflow: hidden;
}

/* 来源标签样式 */
.source-tabs {
  display: flex;
  overflow-x: auto;
  margin-bottom: 12px;
  scrollbar-width: none;
}

.source-tabs::-webkit-scrollbar {
  display: none;
}

.source-tab {
  padding: 6px 12px;
  margin-right: 8px;
  background-color: #f3f4f6;
  border-radius: 16px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}

.active-source {
  background-color: #dc2626;
  color: white;
}

.episode-source-type {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 9px;
  padding: 2px 4px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 4px;
}

/* 原有样式 */
.video-detail-container {
  min-height: 100vh;
  padding-bottom: 16px;
  padding-top: 0; /* 确保没有顶部内边距 */
}

/* 视频播放器和信息区域的布局容器 */
.player-info-layout {
  display: flex;
  justify-content: center;
  flex-direction: column;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transform: translateZ(0);
  will-change: transform;
  z-index: 2;
}

.player-wrapper {
  width: 100%;
  padding-top: env(safe-area-inset-top, 0); /* 添加适配iOS设备的安全区域 */
}

/* 右侧信息区域容器 */
.sidebar-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  max-height: 600px;
  overflow: hidden;
}

.video-info-wrapper {
  width: 100%;
}

/* 视频信息样式 */
.video-info {
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-stats {
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
}

.stat-item {
  margin-right: 12px;
}

.action-bar {
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.following {
  color: #f06292;
}

.action-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.action-text {
  font-size: 12px;
  margin-top: 4px;
  color: #374151;
}

.action-btn.following .action-text {
  color: #f06292;
}

/* 剧集列表滚动容器样式 */
.episodes-grid-sidebar {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.episodes-grid-sidebar::-webkit-scrollbar {
  width: 4px;
}

.episodes-grid-sidebar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.episodes-grid-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

/* 调整播放器样式，确保它填充其容器 */
.player-wrapper :deep(.video-player-container) {
  width: 100%;
  height: 100%;
}

.player-wrapper :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 移动端显示和桌面端隐藏 */
.mobile-only {
  display: block;
}

/* 桌面端显示和移动端隐藏 */
.desktop-only {
  display: none;
}

/* 桌面端布局优化 */
@media (min-width: 1024px) {
  .player-info-layout {
    flex-direction: row;
    max-width: 1440px; /* 与底部区域保持一致的宽度 */
    margin-left: auto;
    margin-right: auto;
  }

  .player-wrapper {
    width: 75%; /* 增加播放器宽度比例，从65%到75% */
    flex-shrink: 0;
    transition: width 0.3s ease;
  }

  .sidebar-wrapper {
    width: 25%;
    border-left: 1px solid #f0f0f0;
    transition: width 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 600px;
  }

  /* 当侧边栏隐藏时，播放器占据100%宽度 */
  .player-info-layout.sidebar-hidden .player-wrapper {
    width: 100%;
  }

  .player-info-layout.sidebar-hidden .sidebar-wrapper {
    display: none;
  }

  .video-info-wrapper {
    display: flex;
    flex-direction: column;
  }

  .video-info {
    padding: 16px;
    flex: 1;
  }

  .video-title {
    font-size: 18px; /* 减小字体大小以适应更窄的侧边栏 */
    margin-bottom: 12px;
    line-height: 1.3;
  }

  .mobile-only {
    display: none;
  }

  .desktop-only {
    display: block;
  }

  /* 其他内容区域保持最大宽度限制 */
  .episodes-section,
  .content-container,
  .related-recommendations {
    max-width: 1440px; /* 保持之前的最大宽度 */
    margin-left: auto;
    margin-right: auto;
  }
}

/* 适应大屏幕尺寸 */
@media (min-width: 1600px) {
  .player-info-layout,
  .episodes-section,
  .content-container,
  .related-recommendations {
    max-width: 1600px; /* 在超大屏幕上进一步增加最大宽度 */
    margin-left: auto;
    margin-right: auto;
  }

  .player-wrapper {
    width: 78%; /* 在大屏幕上进一步增加播放器宽度 */
  }

  .sidebar-wrapper {
    width: 22%; /* 相应减少侧边栏宽度 */
  }

  :deep(.recommendations-list) {
    grid-template-columns: repeat(6, 1fr);
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tag {
  padding: 4px 8px;
  background-color: #f3f4f6;
  border-radius: 999px;
  font-size: 12px;
}

.description {
  font-size: 14px;
  color: #4b5563;
  white-space: pre-line;
  margin: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.description.collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 3; /* 限制显示三行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.show-more i {
  margin-left: 4px;
  font-size: 12px;
}

.meta-item {
  font-size: 13px;
  color: #4b5563;
}

.meta-value {
  color: #374151;
}

/* 评论列表样式 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
  overflow-y: auto;
  flex-grow: 1;
  padding-bottom: 60px; 
  scrollbar-width: none; 
  -ms-overflow-style: none; 
  max-height: 450px; 
}

.comment-list::-webkit-scrollbar {
  width: 0; 
  display: none;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-author {
  font-weight: 500;
  font-size: 14px;
  color: #374151;
}

.comment-date {
  font-size: 12px;
  color: #9ca3af;
}

.comment-text {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 8px;
  line-height: 1.5;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
}

.action-btn:hover {
  color: #dc2626;
}

.reply-btn {
  margin-left: auto;
}

.reply-list {
  margin-top: 12px;
  padding-left: 12px;
  border-left: 2px solid #e5e7eb;
}

.reply-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.reply-avatar img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.reply-author {
  font-weight: 500;
  font-size: 13px;
  color: #374151;
}

.reply-date {
  font-size: 12px;
  color: #9ca3af;
}

.reply-text {
  font-size: 13px;
  color: #4b5563;
  word-break: break-word;
}

.reply-to {
  color: #2563eb;
}

.reply-actions {
  margin-top: 4px;
}

.comment-placeholder {
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

/* 评论输入区域样式 */
.comment-input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)); /* 适配iPhone底部安全区域 */
  z-index: 100;
  max-width: 1440px; 
  margin: 0 auto; 
  width: 100%;
}

.reply-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #2563eb;
  padding: 0 4px;
  margin-bottom: 4px;
  background-color: white;
}

.cancel-reply {
  color: #6b7280;
  font-size: 12px;
  padding: 0;
}

.comment-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background-color: white;
}

.comment-input {
  flex: 1;
}

/* 移除评论输入框边框和阴影 */
.comment-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  border: none !important;
  background-color: #f5f5f5;
  border-radius: 18px;
  padding: 0 12px;
}

.send-button {
  flex-shrink: 0;
}

/* 剧集列表 */
.episodes-section {
  background-color: white;
  padding: 16px;
  border-radius: 4px;
}

/* 移动端评论区域样式 */
.comments-section {
  background-color: white;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
}

.mobile-comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 10px; /* 确保最后的评论不会被输入框遮挡 */
  max-height: calc(80vh - 130px); /* 设置最大高度 */
  overflow-y: auto; /* 启用垂直滚动 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.mobile-comment-list::-webkit-scrollbar {
  width: 0;
  display: none;
}

/* 确保在移动端和桌面端正确显示的辅助类 */
@media (min-width: 1024px) {
  .mobile-only {
    display: none !important;
  }

  .desktop-only {
    display: block !important;
  }
}

@media (max-width: 1023px) {
  .mobile-only {
    display: block !important;
  }

  .desktop-only {
    display: none !important;
  }
}

.episodes-header {
  display: flex;
  justify-content: space-between;
  height: 35px;
}

.section-title {
  font-weight: 500;
}

.episode-count {
  font-size: 12px;
  color: #6b7280;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.episodes-grid::-webkit-scrollbar {
  width: 4px;
}

.episodes-grid::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.episodes-grid::-webkit-scrollbar-track {
  background: transparent;
}

.episode-item {
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  text-align: center;
  position: relative;
  cursor: pointer;
}

.current-episode {
  border-color: #dc2626;
  color: #dc2626;
  background-color: rgba(220, 38, 38, 0.05);
}

.watched-episode {
  background-color: #f9fafb;
}

.episode-title {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #d1d5db;
}

.progress-fill {
  height: 100%;
  background-color: #dc2626;
  width: 100%;
}

/* 顶部导航栏样式 */
.header-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  /* 隐藏顶部导航栏，但保留容器结构 */
  height: 0;
  overflow: hidden;
}

/* 平板和桌面设备上优化网格显示 */
@media (min-width: 768px) {
  .episodes-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* 大屏设备上优化网格显示 */
@media (min-width: 1024px) {
  .episodes-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

/* 为相关推荐添加样式 */
.related-recommendations {
  margin-top: 12px;
  border-radius: 4px;
  overflow: hidden;
  background-color: white;
}

/* 调整相关视频组件的样式，与播放器区域保持一致 */
:deep(.recommendations-section) {
  background-color: white;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

:deep(.recommendations-list) {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 在手机端默认展示2列 */
  gap: 12px; /* 减小间距使卡片更紧凑 */
  background-color: white;
}

/* 在平板和桌面设备上改为网格布局 */
@media (min-width: 768px) {
  :deep(.recommendations-list) {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

/* 在大屏设备上展示更多列 */
@media (min-width: 1024px) {
  :deep(.recommendations-list) {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 在超大屏设备上展示更多列 */
@media (min-width: 1440px) {
  :deep(.recommendations-list) {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* 适应相关推荐中的项目网格布局 */
:deep(.recommendation-item) {
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  flex-direction: column;
  height: 100%;
  padding: 0;
  background-color: #f9fafb;
  transition: transform 0.2s, box-shadow 0.2s;
}

:deep(.recommendation-item:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  opacity: 1;
}

:deep(.thumbnail-container) {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 4px 4px 0 0;
}

:deep(.recommendation-info) {
  margin-left: 0;
  padding: 12px;
}

:deep(.recommendation-title) {
  font-size: 14px;
  margin-bottom: 8px;
  /* 确保在小屏幕上标题不会太长，最多显示两行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  height: 2.6em;
}

:deep(.section-title) {
  font-size: 18px;
  font-weight: 500;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

/* 适应大屏幕尺寸 */
@media (min-width: 1600px) {
  .player-info-layout,
  .episodes-section,
  .related-recommendations {
    max-width: 1600px; /* 在超大屏幕上进一步增加最大宽度 */
  }

  .player-wrapper {
    width: 78%; /* 在大屏幕上进一步增加播放器宽度 */
  }

  .sidebar-wrapper {
    width: 22%; /* 相应减少侧边栏宽度 */
  }

  :deep(.recommendations-list) {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* 详情按钮样式 */
.detail-button {
  margin-left: auto;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  padding: 2px 8px;
  background-color: rgba(220, 38, 38, 0.1);
  border-radius: 4px;
  cursor: pointer;
}

/* 详情抽屉弹窗 */
.detail-drawer-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overscroll-behavior: contain; /* 阻止滚动传递到下层元素 */
  touch-action: none; /* 禁止触摸操作传递 */
}

.detail-drawer {
  position: absolute;
  bottom: -100%;
  left: 0;
  right: 0;
  border-radius: 16px 16px 0 0;
  padding: 16px;
  max-height: 90vh;
  background-color: white;
  overflow-y: auto;
  transition: bottom 0.3s ease;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.1);
  overscroll-behavior: contain; /* 防止过度滚动影响外层 */
  -webkit-overflow-scrolling: touch; /* 平滑滚动 */
  width: 100%;
  max-width: 100%;
  margin: 0;
  scrollbar-width: none; /* 隐藏滚动条 */
  -ms-overflow-style: none;
}

.detail-drawer::-webkit-scrollbar {
  width: 0;
  display: none;
}

.detail-drawer.open {
  bottom: 0;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.drawer-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  max-width: 85%;
}

.drawer-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  flex: 1;
  padding-right: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-btn {
  font-size: 24px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
}

.drawer-content {
  padding-bottom: 24px;
}

/* 顶部信息区域布局 */
.drawer-top-info {
  display: flex;
  margin-bottom: 20px;
}

/* 封面图片容器 */
.cover-image-container {
  width: 120px;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 右侧信息容器 */
.info-container {
  flex: 1;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
}

.update-info {
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 6px;
}

.actors-list {
  margin-bottom: 8px;
}

.actors-line {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 4px;
  max-height: 4.5em; /* 3行的高度 = 行高 × 3 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tag {
  padding: 2px 6px;
  background-color: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

/* 简介区域 */
.description-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 12px 0;
  color: #374151;
}

.drawer-description {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

/* 无剧集时的提示 */
.no-episodes {
  text-align: center;
  padding: 20px 0;
  color: #6b7280;
  font-size: 14px;
}

/* 为移动端视图中的评论区域添加底部填充，避免被输入框遮挡 */
.comments-section {
  padding-bottom: 60px;
}

/* 为桌面端评论区域添加底部填充 */
.comment-sidebar {
  padding-bottom: 70px;
}

/* 优化移动端输入框的样式 */
@media (max-width: 768px) {
  .comment-input-area {
    left: 0;
    right: 0;
    max-width: 100%;
  }
  
  /* 增加移动端底部安全距离 */
  .comments-section {
    padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
  }
  
  .comment-list, .mobile-comment-list {
    padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
  }
}

/* 番剧列表 */
.anime-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
  background: white;
  min-height: 300px; /* 最小高度，防止闪烁 */
}

/* 桌面端评论区域修复 */
@media (min-width: 1024px) {
  /* 修改评论输入框在桌面端的位置 */
  .comment-sidebar .comment-input-area {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    margin: 0;
    box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.05);
  }
  
  /* 增加评论列表底部内边距，避免被输入框遮挡 */
  .comment-sidebar .comment-list {
    padding-bottom: 70px;
    max-height: 530px; /* 为桌面版调整最大高度 */
  }
  
  /* 确保评论侧边栏有相对定位，以便内部绝对定位元素能够正确定位 */
  .comment-sidebar {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
}

/* 优化播放器容器样式，提高渲染性能 */
.player-wrapper {
  width: 100%;
  padding-top: env(safe-area-inset-top, 0);
  transform: translateZ(0); /* 启用硬件加速 */
  will-change: transform; /* 提示浏览器该元素将会改变 */
  backface-visibility: hidden; /* 防止3D转换时的闪烁 */
}
</style>