import prismaClient  from '../src/lib/prisma';

const prisma = prismaClient;

async function cleanup() {
  console.log('🧹 Очистка существующих данных...');

  // Удаляем в правильном порядке (обратном к созданию)
  await prisma.payment.deleteMany({});
  await prisma.breeding.deleteMany({});
  await prisma.breedingProtocol.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.experimentAnimal.deleteMany({});
  await prisma.experiment.deleteMany({});
  await prisma.measurement.deleteMany({});
  await prisma.recordPhoto.deleteMany({});
  await prisma.animalRecord.deleteMany({});
  await prisma.animalPhoto.deleteMany({});
  await prisma.customFieldValue.deleteMany({});
  await prisma.animal.deleteMany({});
  await prisma.customField.deleteMany({});
  await prisma.animalType.deleteMany({});
  await prisma.userLaboratory.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.laboratory.deleteMany({});
  await prisma.plan.deleteMany({});

  console.log('✅ Очистка завершена');
}

async function main() {
  try {
    console.log('🌱 Начинаем наполнение базы данных...');

    // Очищаем существующие данные
    await cleanup();

    // Создаем планы подписки
    console.log('📋 Создание планов подписки...');
    const plan1 = await prisma.plan.create({
      data: {
        name: 'Free',
        description: 'Базовый бесплатный план для малых лабораторий',
        price: 0,
        currency: 'CAD',
        billingCycle: 'MONTHLY',
        maxUsers: 3,
        features: {
          maxAnimals: 50,
          experiments: true,
          basicReporting: true,
          storage: '1GB',
        },
        isActive: true,
      },
    });
    const plan2 = await prisma.plan.create({
      data: {
        name: 'Standard',
        description: 'Стандартный план для средних лабораторий',
        price: 49.99,
        currency: 'CAD',
        billingCycle: 'MONTHLY',
        maxUsers: 10,
        features: {
          maxAnimals: 500,
          experiments: true,
          advancedReporting: true,
          breeding: true,
          storage: '10GB',
        },
        isActive: true,
      },
    });
    await prisma.plan.create({
      data: {
        name: 'Premium',
        description: 'Премиум план для крупных исследовательских центров',
        price: 149.99,
        currency: 'CAD',
        billingCycle: 'MONTHLY',
        maxUsers: 50,
        features: {
          maxAnimals: 'unlimited',
          experiments: true,
          advancedReporting: true,
          breeding: true,
          customFields: true,
          apiAccess: true,
          storage: '100GB',
        },
        isActive: true,
      },
    });
    console.log('✅ Планы подписки созданы');

    // Создаем лаборатории
    console.log('🏢 Создание лабораторий...');
    const laboratory1 = await prisma.laboratory.create({
      data: {
        name: 'Лаборатория молекулярной биологии',
        description: 'Исследования в области генетики и молекулярной биологии',
        username: 'director_molbio',
        position: 'Директор лаборатории',
      },
    });
    const laboratory2 = await prisma.laboratory.create({
      data: {
        name: 'Центр экспериментальной медицины',
        description: 'Доклинические исследования и разработка лекарственных препаратов',
        username: 'researcher_petrov',
        position: 'Старший исследователь',
      },
    });
    console.log('✅ Лаборатории созданы');

    // Создаем подписки для лабораторий
    console.log('💳 Создание подписок...');
    const subscription1 = await prisma.subscription.create({
      data: {
        laboratoryId: laboratory1.id,
        planId: plan1.id, // Standard план
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
        status: 'ACTIVE',
        maxUsers: 10,
        paymentMethod: 'Credit Card',
        autoRenew: true,
      },
    });
    const subscription2 = await prisma.subscription.create({
      data: {
        laboratoryId: laboratory2.id,
        planId: plan2.id, // Premium план
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 год
        status: 'ACTIVE',
        maxUsers: 50,
        paymentMethod: 'Bank Transfer',
        autoRenew: true,
      },
    });
    console.log('✅ Подписки созданы');

    // Создаем пользователей
    console.log('👥 Создание пользователей...');
    const user1 = await prisma.user.create({
      data: {
        email: 'director@molbio-lab.ca',
        institution: 'My Lab Inc.',
        address: '123 Research St, Toronto, ON M5V 1A1',
        contactPhone: '+1-416-555-0123',
        password: 'hashedPassword123', // В реальном приложении пароль должен быть захеширован
        firstName: 'Анна',
        lastName: 'Иванова',
      },
    });
    const user2 = await prisma.user.create({
      data: {
        email: 'researcher1@molbio-lab.ca',
        institution: 'Iseehear Inc.',
        address: '456 Medical Ave, Vancouver, BC V6B 2K9',
        contactPhone: '+1-604-555-0456',
        password: 'hashedPassword456',
        firstName: 'Петр',
        lastName: 'Петров',
      },
    });
    const user3 = await prisma.user.create({
      data: {
        email: 'vet@expmed-center.ca',
        institution: 'Lab-Rador Accisst',
        address: '123 Research St, Toronto, ON M5V 1A1',
        contactPhone: '+1-416-555-0123',
        password: 'hashedPassword789',
        firstName: 'Мария',
        lastName: 'Сидорова',
      },
    });
    const user4 = await prisma.user.create({
      data: {
        email: 'tech@expmed-center.ca',
        institution: 'Lab-Irint Inc.',
        address: '456 Medical Ave, Vancouver, BC V6B 2K9',
        contactPhone: '+1-604-555-0456',
        password: 'hashedPassword101',
        firstName: 'Александр',
        lastName: 'Комаров',
      },
    });
    console.log('✅ Пользователи созданы');

    // Связываем пользователей с лабораториями
    console.log('🔗 Создание связей пользователей с лабораториями...');
    await prisma.userLaboratory.create({
      data: {
        userId: user1.id,
        laboratoryId: laboratory2.id,
        role: 'DIRECTOR',
        accessStatus: 'ACTIVE',
      },
    });
    await prisma.userLaboratory.create({
      data: {
        userId: user2.id,
        laboratoryId: laboratory1.id,
        role: 'RESEARCHER',
        accessStatus: 'ACTIVE',
      },
    });
    await prisma.userLaboratory.create({
      data: {
        userId: user3.id,
        laboratoryId: laboratory2.id,
        role: 'VETERINARIAN',
        accessStatus: 'ACTIVE',
      },
    });
    await prisma.userLaboratory.create({
      data: {
        userId: user4.id,
        laboratoryId: laboratory2.id,
        role: 'TECHNICIAN',
        accessStatus: 'ACTIVE',
      },
    });
    console.log('✅ Связи пользователей с лабораториями созданы');

    // Создаем типы животных
    console.log('🐭 Создание типов животных...');
    const animalType1 = await prisma.animalType.create({
      data: {
        name: 'Мыши',
        description: 'Лабораторные мыши для исследований',
        laboratoryId: laboratory1.id,
      },
    });
    const animalType2 = await prisma.animalType.create({
      data: {
        name: 'Крысы',
        description: 'Лабораторные крысы для экспериментов',
        laboratoryId: laboratory1.id,
      },
    });
    const animalType3 = await prisma.animalType.create({
      data: {
        name: 'Кролики',
        description: 'Лабораторные кролики для доклинических исследований',
        laboratoryId: laboratory2.id,
      },
    });
    console.log('✅ Типы животных созданы');

    // Создаем кастомные поля для типов животных
    console.log('📝 Создание кастомных полей...');
    const customField1 = await prisma.customField.create({
      data: {
        name: 'Цвет шерсти',
        fieldType: 'DROPDOWN',
        isRequired: false,
        description: 'Цвет шерсти животного',
        animalTypeId: animalType1.id,
      },
    });
    const customField2 = await prisma.customField.create({
      data: {
        name: 'Номер клетки',
        fieldType: 'TEXT',
        isRequired: true,
        description: 'Номер клетки где содержится животное',
        animalTypeId: animalType1.id,
      },
    });
    const customField3 = await prisma.customField.create({
      data: {
        name: 'Вес при поступлении',
        fieldType: 'NUMBER',
        isRequired: true,
        description: 'Первоначальный вес животного в граммах',
        animalTypeId: animalType2.id,
      },
    });
    console.log('✅ Кастомные поля созданы');

    // Создаем животных
    console.log('🐹 Создание животных...');
    const animal1 = await prisma.animal.create({
      data: {
        identifier: 'M001',
        name: 'Мышка Альфа',
        animalTypeId: animalType1.id,
        laboratoryId: laboratory1.id,
        birthDate: new Date('2024-01-15'),
        sex: 'FEMALE',
        strain: 'C57BL/6',
        genotype: 'WT',
        status: 'ACTIVE',
        location: 'Стеллаж A, Клетка 1',
        origin: 'Внутреннее разведение',
      },
    });
    const animal2 = await prisma.animal.create({
      data: {
        identifier: 'M002',
        name: 'Мышка Бета',
        animalTypeId: animalType1.id,
        laboratoryId: laboratory1.id,
        birthDate: new Date('2024-01-20'),
        sex: 'MALE',
        strain: 'C57BL/6',
        genotype: 'KO',
        status: 'EXPERIMENT',
        location: 'Стеллаж A, Клетка 2',
        origin: 'Внутреннее разведение',
      },
    });
    const animal3 = await prisma.animal.create({
      data: {
        identifier: 'R001',
        name: 'Крыса Гамма',
        animalTypeId: animalType2.id,
        laboratoryId: laboratory1.id,
        birthDate: new Date('2023-12-10'),
        sex: 'MALE',
        strain: 'Wistar',
        genotype: 'WT',
        status: 'ACTIVE',
        location: 'Стеллаж B, Клетка 5',
        origin: 'Поставщик - BioLab Inc',
      },
    });
    const animal4 = await prisma.animal.create({
      data: {
        identifier: 'K001',
        name: 'Кролик Дельта',
        animalTypeId: animalType3.id,
        laboratoryId: laboratory1.id,
        birthDate: new Date('2023-11-05'),
        sex: 'FEMALE',
        strain: 'New Zealand White',
        genotype: 'WT',
        status: 'BREEDING',
        location: 'Вольер 1',
        origin: 'Внешний поставщик',
      },
    });
    console.log('✅ Животные созданы');

    // Создаем значения кастомных полей
    console.log('📊 Создание значений кастомных полей...');
    await prisma.customFieldValue.create({
      data: {
        value: 'Белый',
        animalId: animal1.id,
        customFieldId: customField1.id,
      },
    });
    await prisma.customFieldValue.create({
      data: {
        value: 'A-001',
        animalId: animal1.id,
        customFieldId: customField2.id,
      },
    });
    await prisma.customFieldValue.create({
      data: {
        value: 'Черный',
        animalId: animal2.id,
        customFieldId: customField1.id,
      },
    });
    await prisma.customFieldValue.create({
      data: {
        value: 'A-002',
        animalId: animal2.id,
        customFieldId: customField2.id,
      },
    });
    await prisma.customFieldValue.create({
      data: {
        value: '450',
        animalId: animal3.id,
        customFieldId: customField3.id,
      },
    });
    console.log('✅ Значения кастомных полей созданы');

    // Создаем эксперименты
    console.log('🧪 Создание экспериментов...');
    const experiment1 = await prisma.experiment.create({
      data: {
        title: 'Исследование влияния препарата X на память',
        description: 'Изучение воздействия нового ноотропного препарата на когнитивные функции',
        laboratoryId: laboratory1.id,
        startDate: new Date(),
        status: 'ACTIVE',
        createdById: user2.id,
        protocol: 'Препарат X вводится внутрибрюшинно в дозе 10 мг/кг массы тела ежедневно в течение 14 дней. Тестирование памяти проводится с помощью лабиринта Морриса.',
      },
    });
    const experiment2 = await prisma.experiment.create({
      data: {
        title: 'Токсикологическое исследование препарата Y',
        description: 'Оценка безопасности нового лекарственного средства',
        laboratoryId: laboratory2.id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 дней
        status: 'PLANNED',
        createdById: user3.id,
        protocol: 'Однократное введение препарата Y в возрастающих дозах. Наблюдение в течение 28 дней с ежедневным контролем состояния животных.',
      },
    });
    console.log('✅ Эксперименты созданы');

    // Добавляем животных к экспериментам
    console.log('🔬 Добавление животных к экспериментам...');
    await prisma.experimentAnimal.create({
      data: {
        experimentId: experiment1.id,
        animalId: animal1.id,
        notes: 'Контрольная группа',
      },
    });
    await prisma.experimentAnimal.create({
      data: {
        experimentId: experiment1.id,
        animalId: animal2.id,
        notes: 'Экспериментальная группа - препарат X',
      },
    });
    await prisma.experimentAnimal.create({
      data: {
        experimentId: experiment2.id,
        animalId: animal4.id,
        notes: 'Высокая доза препарата Y',
      },
    });
    console.log('✅ Животные добавлены к экспериментам');

    // Создаем записи наблюдений
    console.log('📋 Создание записей наблюдений...');
    await prisma.animalRecord.create({
      data: {
        animalId: animal1.id,
        recordType: 'ROUTINE_CHECK',
        createdById: user2.id,
        temperature: 37.2,
        weight: 22.5,
        feedIntake: 4.2,
        waterIntake: 5.8,
        activityLevel: 'NORMAL',
        notes: 'Животное активно, аппетит хороший, признаков заболевания не обнаружено',
      },
    });
    await prisma.animalRecord.create({
      data: {
        animalId: animal2.id,
        recordType: 'MEDICATION',
        createdById: user2.id,
        temperature: 37.1,
        weight: 23.1,
        activityLevel: 'NORMAL',
        notes: 'Введен препарат X согласно протоколу эксперимента',
      },
    });
    await prisma.animalRecord.create({
      data: {
        animalId: animal3.id,
        recordType: 'OBSERVATION',
        createdById: user4.id,
        temperature: 38.5,
        weight: 485.2,
        feedIntake: 25.0,
        waterIntake: 45.0,
        activityLevel: 'HIGH',
        notes: 'Повышенная активность, хороший аппетит',
      },
    });
    console.log('✅ Записи наблюдений созданы');

    // Создаем задачи
    console.log('📝 Создание задач...');
    await prisma.task.create({
      data: {
        title: 'Взвешивание животных группы A',
        description: 'Ежедневное взвешивание мышей в экспериментальной группе',
        assignedToId: user2.id,
        experimentId: experiment1.id,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // завтра
        status: 'PENDING',
        priority: 'HIGH',
      },
    });
    await prisma.task.create({
      data: {
        title: 'Подготовка протокола эксперимента',
        description: 'Финализация протокола токсикологического исследования',
        assignedToId: user3.id,
        experimentId: experiment2.id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 дней
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
      },
    });
    await prisma.task.create({
      data: {
        title: 'Обновление базы данных животных',
        description: 'Внести данные о новых поступлениях в систему',
        assignedToId: user4.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 дня
        status: 'PENDING',
        priority: 'LOW',
      },
    });
    console.log('✅ Задачи созданы');

    // Создаем уведомления
    console.log('🔔 Создание уведомлений...');
    await prisma.notification.create({
      data: {
        userId: user2.id,
        title: 'Напоминание о взвешивании',
        message: 'Не забудьте взвесить животных в группе A эксперимента "Исследование влияния препарата X на память"',
        type: 'TASK',
        isRead: false,
      },
    });
    await prisma.notification.create({
      data: {
        userId: user3.id,
        title: 'Новое животное добавлено',
        message: 'В лабораторию поступил новый кролик K001',
        type: 'ANIMAL_ALERT',
        isRead: true,
      },
    });
    await prisma.notification.create({
      data: {
        userId: user4.id,
        title: 'Эксперимент завершен',
        message: 'Эксперимент "Исследование влияния препарата X на память" готов к анализу результатов',
        type: 'EXPERIMENT',
        isRead: false,
      },
    });
    console.log('✅ Уведомления созданы');

    // Создаем протоколы разведения
    console.log('🧬 Создание протоколов разведения...');
    const breedingProtocol1 = await prisma.breedingProtocol.create({
      data: {
        name: 'Стандартное разведение мышей C57BL/6',
        animalTypeId: animalType1.id,
        description: 'Протокол для разведения линии C57BL/6',
        instructions: '1. Подсадка самца к самке в соотношении 1:2\n2. Проверка на наличие вагинальной пробки\n3. Разделение через 10 дней после спаривания\n4. Контроль беременности на 14-16 день',
      },
    });
    await prisma.breedingProtocol.create({
      data: {
        name: 'Разведение кроликов New Zealand White',
        animalTypeId: animalType3.id,
        description: 'Стандартный протокол разведения кроликов',
        instructions: '1. Подсадка самца к самке на 15 минут\n2. Повторная подсадка через 8-12 часов\n3. Пальпация на 14 день\n4. Подготовка гнездового ящика на 28 день',
      },
    });
    console.log('✅ Протоколы разведения созданы');

    // Создаем записи о разведении
    console.log('👶 Создание записей о разведении...');
    await prisma.breeding.create({
      data: {
        motherId: animal1.id, // Мышка Альфа (самка)
        fatherId: animal2.id, // Мышка Бета (самец)
        protocolId: breedingProtocol1.id,
        startDate: new Date('2024-05-01'),
        status: 'ACTIVE',
        notes: 'Первое спаривание для данной пары',
      },
    });
    console.log('✅ Записи о разведении созданы');

    // Создаем платежи
    console.log('💰 Создание платежей...');
    await prisma.payment.create({
      data: {
        subscriptionId: subscription1.id,
        amount: 49.99,
        currency: 'CAD',
        paymentDate: new Date(),
        paymentMethod: 'Credit Card',
        transactionId: 'tx_1234567890',
        status: 'COMPLETED',
        invoiceNumber: 'INV-2024-001',
        notes: 'Автоматический платеж за Standard план',
      },
    });
    await prisma.payment.create({
      data: {
        subscriptionId: subscription2.id,
        amount: 149.99,
        currency: 'CAD',
        paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // -30 дней
        paymentMethod: 'Bank Transfer',
        transactionId: 'bt_0987654321',
        status: 'COMPLETED',
        invoiceNumber: 'INV-2024-002',
        notes: 'Годовая подписка Premium план',
      },
    });
    console.log('✅ Платежи созданы');

    console.log('🎉 База данных успешно наполнена тестовыми данными!');

    // Выводим сводку созданных записей
    console.log('\n📊 Сводка созданных записей:');
  } catch (error) {
    console.error('❌ Ошибка при наполнении базы данных:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Критическая ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
