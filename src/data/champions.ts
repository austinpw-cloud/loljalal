import type { Champion } from "@/types";

/**
 * 내 최애 챔프 모드용 인기 챔피언 목록
 * 한국 서버 인지도/인기 기준 선정
 */
export const POPULAR_CHAMPIONS: Champion[] = [
  // 탑
  { id: "garen", name: "가렌", position: "탑" },
  { id: "darius", name: "다리우스", position: "탑" },
  { id: "fiora", name: "피오라", position: "탑" },
  { id: "aatrox", name: "아트록스", position: "탑" },
  { id: "riven", name: "리븐", position: "탑" },
  { id: "camille", name: "카밀", position: "탑" },
  { id: "irelia", name: "이렐리아", position: "탑" },
  { id: "ornn", name: "오른", position: "탑" },
  { id: "sett", name: "세트", position: "탑" },
  { id: "nasus", name: "나서스", position: "탑" },

  // 정글
  { id: "lee_sin", name: "리 신", position: "정글" },
  { id: "graves", name: "그레이브즈", position: "정글" },
  { id: "viego", name: "비에고", position: "정글" },
  { id: "hecarim", name: "헤카림", position: "정글" },
  { id: "kayn", name: "케인", position: "정글" },
  { id: "elise", name: "엘리스", position: "정글" },
  { id: "nidalee", name: "니달리", position: "정글" },
  { id: "kindred", name: "킨드레드", position: "정글" },

  // 미드
  { id: "ahri", name: "아리", position: "미드" },
  { id: "yasuo", name: "야스오", position: "미드" },
  { id: "zed", name: "제드", position: "미드" },
  { id: "katarina", name: "카타리나", position: "미드" },
  { id: "syndra", name: "신드라", position: "미드" },
  { id: "leblanc", name: "르블랑", position: "미드" },
  { id: "akali", name: "아칼리", position: "미드" },
  { id: "yone", name: "요네", position: "미드" },
  { id: "orianna", name: "오리아나", position: "미드" },
  { id: "lux", name: "럭스", position: "미드" },

  // 원딜
  { id: "jinx", name: "징크스", position: "원딜" },
  { id: "ezreal", name: "이즈리얼", position: "원딜" },
  { id: "kaisa", name: "카이사", position: "원딜" },
  { id: "jhin", name: "진", position: "원딜" },
  { id: "caitlyn", name: "케이틀린", position: "원딜" },
  { id: "vayne", name: "베인", position: "원딜" },
  { id: "draven", name: "드레이븐", position: "원딜" },
  { id: "aphelios", name: "아펠리오스", position: "원딜" },
  { id: "samira", name: "사미라", position: "원딜" },
  { id: "missfortune", name: "미스 포츈", position: "원딜" },

  // 서포터
  { id: "thresh", name: "쓰레쉬", position: "서포터" },
  { id: "lulu", name: "룰루", position: "서포터" },
  { id: "nautilus", name: "노틸러스", position: "서포터" },
  { id: "leona", name: "레오나", position: "서포터" },
  { id: "pyke", name: "파이크", position: "서포터" },
  { id: "blitzcrank", name: "블리츠크랭크", position: "서포터" },
  { id: "nami", name: "나미", position: "서포터" },
  { id: "yuumi", name: "유미", position: "서포터" },
];
