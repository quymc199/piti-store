export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  description: string;
  shortDescription: string;
  image: string;
  hoverImage: string;
  images?: string[];
  colors: string[];
  sizes?: string[];
  category: string;
  isSale?: boolean;
  status?: 'active' | 'inactive';
  warrantyNote?: string;
  updatedAt?: any;
}

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Bình Giữ Nhiệt PiTi Classic 500ml',
    price: 450000,
    originalPrice: 590000,
    rating: 4.9,
    reviews: 128,
    description: 'Giữ lạnh lên đến 24 giờ và giữ nóng suốt 12 giờ nhờ công nghệ hút chân không 2 lớp thép không gỉ 304 cao cấp. Lớp sơn tĩnh điện cao cấp giúp chống trầy xước và mang lại cảm giác cầm nắm chắc chắn, thoải mái trong mọi điều kiện.',
    shortDescription: 'Chất liệu thép không gỉ 304 cao cấp, thiết kế tối giản.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBS0RMKFMMHrrSFc85Ac-g1aidr9UtcBfZwxLezg4ruShAn-0TQT4kWk4zVZavFXoacdUdqXvbaxN7NWGbhZfz9W9ssPSzuaqGezMf6Nd15KTk9zjwz3VCMKVUv1iclW1Xffdo-bGX3C3RfOJaFX51jl5puKGFDRSlcYyKfUtsQI7kMeCDYLMPdGDigk0B2DdrZo6REQAViZBQLq__t8g1WYE-4x72-0j2qDwX7UY4TSggVO6yVymNzDwDSV-vrSUPS5ce_rcF2M8y',
    hoverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMaFTpIJXImIAtEZ2BQysWvgPV4OY9V0ZfPR-E-Bw3QVHdo-wClUoLHyhjWBpU1Z50xACayWu3-1_lb8cQI6mKhVQwHTVf67q_8kGdmFex7QX-AAxgsq__UzdlB0oWA8j_EJPciF2an9AtVsa6bEInYHWAj_l52yN6FfKUzJD5NzDHUBZBxrm127tK-RS5d03lYA-A3hS7Z0Di3NFMRR47NVEtfI-B4GND7CIEmQn5P4znHac9F4kTkW_rAqQpkaOQFDh0rJcRw8X1',
    colors: ['#EE4D2D', '#b71507', '#303030', '#e4e2e1'],
    category: 'Bình giữ nhiệt',
    isSale: true,
    warrantyNote: 'Bảo hành nhiệt độ 12 tháng tại PiTi'
  },
  {
    id: '2',
    name: 'Cốc Sứ PiTi Minimalist Green',
    price: 250000,
    rating: 4.9,
    reviews: 85,
    description: 'Cốc sứ cao cấp với nắp gỗ sồi tự nhiên. Thiết kế tối giản, màu xanh sage dịu mắt.',
    shortDescription: 'Chất liệu gốm cao cấp, nắp gỗ sồi tự nhiên.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3NMyPKCP2oTdlSScAGXeuWiTwkgn3G3D9wnNuULDKaQO8BRGIpTUlV_NyycbFUF9SIx7HvK1JQ01hc00K8Drnd6r4CnwzSi9_52ZbngqrPfkHc9q1DhtMS3Fe06JY4FB3AYM8_yWluclRDPse2f7tAq-Ja-Os5uAS8_BKa7t-8PItW5UNF0KiZk8toMXSjEcsU1mjRDKUww5GnFjL_phK5LgQ72lDZIZNeTf3QMeREpZ1cDIkrCWynhAEQ1NjcuQ3R-2zFIva6YfK',
    hoverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIdNIhrLqVGj95PXPJxLPCXERUAD-Nh8Pqa0VnfSDsXWC4LDLpcPKXqs10NNR7tiJcKyEr5a0bO7VZc4nDaQXQbuQfkdBw8DVv-X3BV1slltybK59-54iDEqBBnKl8eJok5GynF86dmpxboQZZevdsSR2bap3sGum-wPbmrRDml_GXXAKT9BBt9lw7Jz_UEyW17fYoEe4WxRD91nIp67LK2OTf4wKmzlmjFZhe7qCxgdgMxMVhWBw9pYbmnNGiPx7bbhRjeDGOMH9-',
    colors: ['#49624a', '#e4e2e1', '#303030'],
    category: 'Cốc sứ',
    warrantyNote: 'Bảo hành nứt vỡ khi nhận hàng tại PiTi'
  },
  {
    id: '3',
    name: 'Cốc Thủy Tinh PiTi Borosilicate',
    price: 185000,
    rating: 4.8,
    reviews: 42,
    description: 'Thủy tinh Borosilicate chịu nhiệt cực tốt, thiết kế 2 lớp chống nóng.',
    shortDescription: 'Chịu nhiệt tốt, thành dày 2 lớp chống nóng tay.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv_CBH8WrOpdWF_ugKR4n1_sMEqwb7Up_oQMavy5IKkpBRW2vwP9uXStaCJv9-_YF5h-BCeho8OxfHi0UTHyCS0L9rKiD779grJ4Rj4NFVG8rTbK2W6QmguS_nw1yu5_ImTrUXZArpZb-jvgoRhhtLyz7uikyrSxDoJt66BbCpjFwiENgYQbc5CEr3SYXQBW93KMgmBKvYP91uz8az7_hiXeCZkQPcYesgHL4ytAJsoZWlJNtbq6-m6yhYqBJjm8s8pzSRfvdU6DZl',
    hoverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZJUf8lUtrWDNR0WKxzJK8LZMwhsyY_f1uQVgVaWO2C5lrN2OOS76VLJD2-Nv0NDp18GhNEY-lPt8efWEO4rg_5SZMwugKOT7qA8Z-SlVeeAhZDUj4n0eCWJcJ2wDYQ9RSSl6S3xhFvCmztL7HTMQa56efzuWuoHyJYrhzFvzl73xqE2kS0PYBdnLdPt94-O91tpGH4iGkWwyjy4BfZUyIEYwfLuE5aNPSg6d5o3BoDzg733hdHlihT3MNCQm_3jq658yJ71Xnvr_q',
    colors: ['#ffffff', '#ffdad4'],
    category: 'Cốc thủy tinh',
    warrantyNote: 'Bảo hành nhiệt độ 6 tháng tại PiTi'
  },
  {
    id: '4',
    name: 'Ly Giữ Nhiệt PiTi Urban Black',
    price: 320000,
    originalPrice: 450000,
    rating: 5.0,
    reviews: 210,
    description: 'Ly giữ nhiệt màu đen nhám sang trọng, phù hợp cho dân văn phòng.',
    shortDescription: 'Vỏ nhám sang trọng, giữ lạnh tới 12h.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMOKGiDhLpohVXy8LzX_SD2z6ZUWImLZtQBxxiHi-6vRfzECBRkkZS2cHpgVGbdhJ7LADiBgeJ60qnyJF-KslHLlWO28EEZqD3u-rQFwA2uru2W_KjEOUBainySYZfpUWKUS0yLBcXGakNV0VmM-wSWSIR672wdy8SEKzoh6HWue81ZnfNCRRP5QCWrqmV0Qupyu1TPSV0ysnbr2TnnOq6Uau4A39q4q_jeNusVaysHWIP-E-VfAsZ5Ul1GoFkHU1FJzJzoYdr6egb',
    hoverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1xCSl_taaP1_QS6y-i5F_3ECwS31eVtiA715Dv5LTmxLAc-r-Pe7xZuyXsIcrO_AJW3iAHye1LRcDoKQK1ZCjvJni97jKdX3A2gV0Dj9iqNSYBRKUc151wDVL5fDc1IsA34xhfbl2GUSSkEnuTYRswHII_RyXB5UFIxuAzPx3NFp2QqwEAb0mL-zY3bgHfrGp-Aly2vZ0PaNJ1P1ogzghS3J0NWT-ELnnH3c8POv5oYXmdfsxdFrxmF2dEvb4cHyPRNW5lDOB6SBf',
    colors: ['#303030', '#49624a'],
    category: 'Bình giữ nhiệt',
    isSale: true,
    warrantyNote: 'Bảo hành nhiệt độ 12 tháng tại PiTi'
  },
  {
    id: '5',
    name: 'Cốc Sứ PiTi Terrazzo Art',
    price: 210000,
    rating: 4.7,
    reviews: 56,
    description: 'Họa tiết Terrazzo độc đáo trên nền gốm sứ cao cấp.',
    shortDescription: 'Họa tiết đá mài thủ công, phong cách nghệ thuật.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCC3ZPJtuo0c4JoCbTpGZsEB6l4ssFaiZOtmZlWa1gU5JUtFrtQEZpgw_2c-ztn2JYZHe0djn2_UaIzQTeK9Q-a_F-LTpQXkIYR5573XNZHB0noiECeFwQySTnpYnfzOKIYKTXQcVlt7qM9mVrS8SX-NevFj8qc9xmtqyA_4SAwUkZFObfd_WFIRKs3vnArK4WMjCDtkGKgEHjwFdRwDX-lSZpZ7OzBiSJHXGzhOUiYvtdIjI9ZtTS-PQTNQDikq_M4XiiZteCU2973',
    hoverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDo1jR-gej5Jx-mFBe1Qq-bmZVRwEjOEVYEM9ciHHnMQ2BxVcP5Git4qt94o7_PFVY57_tb0-AbFMT7jb2g3qNUevFDhOa-Pt5Wlj83zF3aN2jNE8Bab_63u06IbWxsnxwUzHJDg1d9eLtxxtisroKGk_udErbxwqWCGtjiTX2G9DsVLI2OVK_Kk9DDVVVvD9HnJpaXDME3w7SJeu6fjtJ7ZXiwMZSASYGu-I6CrIb83EB9Kmpj4Efug1JgHMqnH-6Ov112TBrOvlp0',
    colors: ['#ffffff'],
    category: 'Cốc sứ',
    warrantyNote: 'Bảo hành nứt vỡ khi nhận hàng tại PiTi'
  },
  {
    id: '6',
    name: 'Cốc Gỗ PiTi Organic Wood',
    price: 350000,
    rating: 4.9,
    reviews: 34,
    description: 'Cốc gỗ tự nhiên với vân gỗ độc bản, thân thiện với môi trường.',
    shortDescription: 'Chất liệu tự nhiên, thân thiện môi trường.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCatK4O6Sz1W4MZdWMXamqSnDwknb7GMhJKi5D9R4t1oxkAEhNTSCwksrW7g5quXikkEMU-tm3N6_bTo3LGU-iZp45BBRpDLVgtQVCU6ch4Z9MEEkZmPGA3lymab_39rv8Strc_4kxKd3keZjXnSStueN9za7Wn4fwZ8JwiT3_3QPRYmD4f6ANiX2NAV4iBTYhdveMIn7Zw5JQmtFQ-Ck7O8BTdqNhNzzYl3nM-qbfMIsxsqhCo_qU2-DzWFt_AAY4qzEr1kb-tJK8K',
    hoverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6T1dLWyp3wMF1fEZA1PBGqTCbNleMdeBYWg3MtQ40T2C41A8b2BQ86UVNg0wwXsr02nQD80rSN0dX1R5Yflnb9tKyYbO1t7NsEnLoGV8YChNVSvSBr9AJsGgL6Q5WUYk9Dr62qvXo9YtFi2aGo7wTtaIh61pKCynUt3bKa-VNulRB7a_kc_Drwjr-77Q40zDb83hm9mrHeMv0nPoYLZ4KKUFqWWdXe_w0XrtEUlXFS4kQ3lQUtax0MFHhP4uRqjhjNmDqRLjIJSeC',
    colors: ['#49624a'],
    category: 'Cốc gỗ',
    warrantyNote: 'Bảo hành 12 tháng tại PiTi'
  },
  {
    id: '7',
    name: 'Cốc Sứ PiTi Pastel Dream',
    price: 195000,
    rating: 4.6,
    reviews: 78,
    description: 'Cốc sứ màu pastel dịu nhẹ, quai cầm công thái học.',
    shortDescription: 'Màu sắc dịu nhẹ, quai cầm công thái học.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8ZnlqyaiSE1ovfEqRzsJnvQAAK_mwPSGOPoEMnSz5b3q_7lRMcntr4Zm4AdAKZTB_6fAVfb0kF4b0d0oAJG13JcnfwV1HFD4p2S26nGD4n6zhnGib8_s9wacjcqwXo687aPcKi70oEKC4XrPpNXLDz23lF6AKY8VIOO2pdKsFV4izmTqhP-KbKjvxRdio3m79dotRw1UsO-lqR6FW3Ca9ZJvHGDGspx4Jr_nylR7mWGdRUKyGhEFGBxM_UsLLuQqoan_Z3teeWl-e',
    hoverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeVMPiRCMB7cRkkIJx_NcvM1D_3Sbijtp5itky7eakWMMZEs3KE0rHy0z-tuxdqekfDc2Pq_yb8OhogbBELGPpSnGUqm7SSk7dp1s0k4a2ubpulQ_fnDHQPUAr6jjDUEN2dlcw2NA9hQEeUX3Dy4WKXM__gtccfosVLnpelqk04YGmL3uACYZbQ7N5nHmG0LwyNab9_DsizxAaw_VAn6s2P_GVmWqRLC9EvjPxknV7B6qj0lY2sPlYpwZiP5VaJKK1kqRJJSTgrLO2',
    colors: ['#cdeacb', '#ffdad4'],
    category: 'Cốc sứ',
    warrantyNote: 'Bảo hành nứt vỡ khi nhận hàng tại PiTi'
  },
  {
    id: '8',
    name: 'Bộ Hộp Cơm Gốm Sứ PiTi Eco',
    price: 290000,
    rating: 4.8,
    reviews: 145,
    description: 'Bộ hộp cơm gốm sứ với nắp gỗ tre, an toàn cho sức khỏe và môi trường.',
    shortDescription: 'Gốm sứ cao cấp, nắp gỗ tre tự nhiên.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFDHmXtFuujNFblueWZAZTPEGJURvAqXJtvlMdI38no6F61As_Ir9aa55oPvAoYCfZoQOKFndNcTaw2XZpbPHSvaIPER-_u8eAVeJXXf7KLEMYsr0KmJHFkTw7urVx4ZmjjtJcn5diUZEdfx7zRC6DWxHx1bOhRJ-7na1-hObFSFF4TLenskXZ1XBH3VbumhrE1nhCURP9fE5MDaIa3w98miPpMnh1njK3nqG_mLjx1wdWJXBjXBQe1RxGEbKOO8iLr-rBti8_TCjR',
    hoverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFDHmXtFuujNFblueWZAZTPEGJURvAqXJtvlMdI38no6F61As_Ir9aa55oPvAoYCfZoQOKFndNcTaw2XZpbPHSvaIPER-_u8eAVeJXXf7KLEMYsr0KmJHFkTw7urVx4ZmjjtJcn5diUZEdfx7zRC6DWxHx1bOhRJ-7na1-hObFSFF4TLenskXZ1XBH3VbumhrE1nhCURP9fE5MDaIa3w98miPpMnh1njK3nqG_mLjx1wdWJXBjXBQe1RxGEbKOO8iLr-rBti8_TCjR',
    colors: ['#e4e2e1'],
    category: 'Hộp cơm',
    warrantyNote: 'Bảo hành 12 tháng tại PiTi'
  }
];

export const PLACEHOLDER_IMAGE = "https://picsum.photos/seed/piti/800/800";
