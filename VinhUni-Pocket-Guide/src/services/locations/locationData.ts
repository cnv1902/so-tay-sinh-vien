import type { Location } from '../../types/location';

export const locations: Location[] = [
  {
    id: 'toa-nha-dieu-hanh',

    name: 'Tòa nhà Điều hành',

    description:
      'Tòa nhà tập trung các đơn vị hành chính và các phòng chức năng của Đại học Vinh.',

    purpose:
      'Thực hiện các công việc hành chính, đào tạo và hỗ trợ sinh viên.',

    category: 'administration',

    address: 'Cơ sở 1 — Đại học Vinh',

    floor: 'Tầng 1',

    room: 'Phòng Đào tạo',

    coordinate: {
      latitude: 18.6736,
      longitude: 105.6923,
    },

    isInsideCampus: true,
  },

  {
    id: 'thu-vien',

    name: 'Thư viện Đại học Vinh',

    description:
      'Không gian học tập, nghiên cứu và khai thác tài liệu dành cho sinh viên.',

    purpose:
      'Học tập, đọc sách và sử dụng tài nguyên thư viện.',

    category: 'building',

    address: 'Cơ sở 1 — Đại học Vinh',

    floor: 'Tầng 1',

    coordinate: {
      latitude: 18.6740,
      longitude: 105.6930,
    },

    isInsideCampus: true,
  },

  {
    id: 'tram-y-te',

    name: 'Trạm Y tế',

    description:
      'Điểm hỗ trợ và chăm sóc sức khỏe cho sinh viên và cán bộ trong trường.',

    purpose:
      'Sơ cứu và hỗ trợ các vấn đề sức khỏe.',

    category: 'healthcare',

    address: 'Cơ sở 1 — Đại học Vinh',

    coordinate: {
      latitude: 18.6730,
      longitude: 105.6918,
    },

    isInsideCampus: true,
  },

  {
    id: 'cong-chinh',

    name: 'Cổng chính Đại học Vinh',

    description:
      'Cổng ra vào chính của khuôn viên Đại học Vinh.',

    purpose:
      'Lối ra vào chính của sinh viên, cán bộ và khách.',

    category: 'other',

    address: 'Đại học Vinh',

    coordinate: {
      latitude: 18.6745,
      longitude: 105.6915,
    },

    isInsideCampus: true,
  },
];
